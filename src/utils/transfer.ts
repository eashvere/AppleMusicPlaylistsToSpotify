import SpotifyWebApi from "spotify-web-api-js";
import {
  currentPlaylistTransfered,
  errorState,
  eta,
  progress,
  readingApplePlaylist,
  spotify_access_token,
  spotify_expired,
  totalProgress,
  transferSuccess,
} from "./storable";
import Bottleneck from "bottleneck";

interface Pagination {
  next?: string;
  items: object[];
}

export const getAllPages = async <Response extends Pagination>(
  request: Promise<Response>,
  spotifyApi: SpotifyWebApi.SpotifyWebApiJs
): Promise<Response> => {
  const paginatedResponse = await request;

  let currentResponse = paginatedResponse;

  while (currentResponse.next) {
    currentResponse = (await apiWrapper(
      spotifyApi.getGeneric(currentResponse.next)
    )) as Response;
    paginatedResponse.items = paginatedResponse.items.concat(
      currentResponse.items
    );
  }

  return paginatedResponse;
};

async function getSongsfromAppleMusicPlaylist(
  playlist: AppleMusicApi.Playlist
) {
  const music = MusicKit.getInstance();
  const tracks: Array<AppleMusicApi.Song> = [];
  let hasNextPage = true;
  readingApplePlaylist.set(true);
  while (hasNextPage) {
    const queryParameters = {
      limit: 25,
      offset: tracks.length,
    };

    // Make a request for the next page
    const {
      data: { data: dataForPage = [], next },
    } = await music.api.music(
      `v1/me/library/playlists/${playlist.id}/tracks`,
      queryParameters
    );
    tracks.push(...dataForPage);

    // Cast the `next` property to a boolean, where `undefined`
    // becomes `false`, but any URL value would be `true`
    //
    // When this is `false`, then the loop stops
    hasNextPage = !!next;
  }
  readingApplePlaylist.set(false);
  return tracks;
}

function removeFeat(str: string | undefined) {
  if (str === undefined) {
    return "";
  }
  const featRegex = /\(feat\..+?\)/i;
  return str.replace(featRegex, "").trim();
}

function removeExtraArtists(str: string | undefined) {
  if (str === undefined) {
    return "";
  }
  const splitted = str.split(" & ");
  return splitted[0];
}

function getSearchQueryforSong(track: AppleMusicApi.Song) {
  const parsedTrack = removeFeat(track.attributes?.name);
  const parsedArtist = removeExtraArtists(track.attributes?.artistName);
  const parsedAlbum = removeFeat(track.attributes?.albumName);
  const query = `track:${parsedTrack} artist:${parsedArtist} album:${parsedAlbum}`;
  return query;
}

function editDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue =
              Math.min(
                // @ts-ignore
                Math.min(newValue, lastValue),
                // @ts-ignore
                costs[j]
              ) + 1;
          costs[j - 1] = lastValue;
          // @ts-ignore
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  // @ts-ignore
  return costs[s2.length];
}

function mostSimilarSong(
  track: AppleMusicApi.Song,
  albumTracks: SpotifyApi.TrackObjectSimplified[],
  album: SpotifyApi.AlbumObjectSimplified
) {
  const trackName = removeFeat(track.attributes?.name);
  const res = albumTracks.map((song) => editDistance(trackName, song.name));

  const mostStringSimilar = albumTracks[res.indexOf(Math.min(...res))];
  if (mostStringSimilar === undefined) return undefined;
  if (track.attributes?.durationInMillis === mostStringSimilar.duration_ms) {
    // Hack to get return in correct type.
    const ret: SpotifyApi.TrackObjectFull = {
      ...mostStringSimilar,
      album: album,
      external_ids: {
        ean: "",
        isrc: "",
        upc: "",
      },
      popularity: 0,
    };
    return ret;
  } else {
    return undefined;
  }
}

async function findTrackbyAlbum(
  spotifyApi: SpotifyWebApi.SpotifyWebApiJs,
  track: AppleMusicApi.Song
) {
  const parsedArtist = removeExtraArtists(track.attributes?.artistName);
  const parsedAlbum = removeFeat(track.attributes?.albumName);
  const query = `artist:${parsedArtist} album:${parsedAlbum}`;
  try {
    const albumData = await apiWrapper(
      spotifyApi.searchAlbums(query, { limit: 5 })
    );
    const album = albumData.albums.items[0];
    if (album === undefined) return undefined;
    const albumTracks = await getAllPages<SpotifyApi.AlbumTracksResponse>(
      spotifyApi.getAlbumTracks(album.id),
      spotifyApi
    );
    return mostSimilarSong(track, albumTracks.items, album);
  } catch (err: any) {
    if (err.status === 401) {
      errorState.set(err);
      spotify_expired.set(true);
    }
    console.error(err.status);
    return undefined;
  }
}

// Clearly not in your area!
async function findSingles(
  spotifyApi: SpotifyWebApi.SpotifyWebApiJs,
  track: AppleMusicApi.Song
) {
  const parsedArtist = removeExtraArtists(track.attributes?.artistName);
  const parsedTrack = removeFeat(track.attributes?.name);
  const query = `artist:${parsedArtist} track:${parsedTrack}`;
  try {
    const data = await spotifyApi.searchTracks(query, { limit: 5 });
    return data.tracks.items[0];
  } catch (err: any) {
    if (err.status === 401) {
      errorState.set(err);
      spotify_expired.set(true);
    }
    console.error(err.status);
    return undefined;
  }
}

function timeout(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const queryTrack = async (track: AppleMusicApi.Song, spotifyApi: SpotifyWebApi.SpotifyWebApiJs, retries = 5): Promise<SongReview> => {
  const query = getSearchQueryforSong(track);
  const trackReview: SongReview = {
    appleSong: track,
    spotifySong: undefined,
  };
  try {
    const data = await spotifyApi.searchTracks(query, { limit: 5 });
    trackReview.spotifySong = data.tracks.items[0];
    const album = (trackReview.appleSong.attributes?.albumName || '')
    if(album.includes("- Single") || album.includes("- EP") || album.includes("(Apple Music Edition)") || album.includes(".feat")) {
      trackReview.spotifySong = await findSingles(spotifyApi, track);
    } else if (trackReview.spotifySong === undefined) {
      trackReview.spotifySong = await findTrackbyAlbum(spotifyApi, track);
    }
    return trackReview;
  } catch (err: any) {
    if (err.status == 429) {
      console.error(err);
      if (retries > 0) {
        await timeout(15000);
        return queryTrack(track, spotifyApi, retries - 1);
      }
    }
    console.error(err);
    errorState.set(err);
    spotify_expired.set(true);
    return trackReview;
  }
};

const minTime = 333;
const limiter = new Bottleneck({
  minTime: minTime
});

export async function transfer(playlists: AppleMusicApi.Playlist[]) {
  const spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(spotify_access_token.get());
  const reviewAllPlaylists: Array<PlaylistReview> = [];
  for (const playlist of playlists) {
    currentPlaylistTransfered.set(playlist);
    const tracks = await getSongsfromAppleMusicPlaylist(playlist);
    if (tracks.length > 0) {
      totalProgress.set(tracks.length);
      const reviewPlaylist: PlaylistReview = {
        playlist: playlist,
        tracks: [],
      };
      
      progress.set(0);

      eta.set(tracks.length * minTime);
      const scheduleSongQuery = async (track: AppleMusicApi.Song) => {
        return limiter.schedule(async () => {
          return queryTrack(track, spotifyApi).then((val) => {
            progress.set(progress.get() + 1);
            eta.set(eta.get() - minTime);
            return val;
          })
        })
      }

      const queries = tracks.map((track) => scheduleSongQuery(track));
      reviewPlaylist.tracks = await Promise.all(queries);

      eta.set(0);

      progress.set(0);
      reviewAllPlaylists.push(reviewPlaylist);
    }
  }
  currentPlaylistTransfered.set(undefined);
  return reviewAllPlaylists;
}

function* chunks<T>(arr: T[], n: number): Generator<T[], void> {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}

export async function apiWrapper<T>(call: Promise<T>, retries = 5) {
  try {
    const data = await call;
    return data;
  } catch (err: any) {
    if (err.status == 429) {
      if (retries > 0) {
        await timeout(15000);
        return apiWrapper(call, retries - 1);
      }
    }
    console.error(err);
    errorState.set(err);
    spotify_expired.set(true);
    throw new Error(err);
  }
}

const playlistLimiter = new Bottleneck({
  minTime: minTime
});

export async function transferToSpotify(pr: PlaylistReview) {
  const spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(spotify_access_token.get());

  const me = await apiWrapper(spotifyApi.getMe());

  const newPlaylist = await apiWrapper(
    spotifyApi.createPlaylist(me.id, {
      name: pr.playlist.attributes?.name,
      description: pr.playlist.attributes?.description?.standard || "",
      public: false,
    })
  );

  const playlistId = newPlaylist.id;
  const trackChunks = [
    ...chunks(
      pr.tracks.map((i) => i.spotifySong?.uri || ""),
      100
    ),
  ];

  const promises = [];
  for (const tracks of trackChunks) {
    const filteredTracks = tracks.filter((track) => track !== "");
    promises.push(
      playlistLimiter.schedule(() => apiWrapper(spotifyApi.addTracksToPlaylist(playlistId, filteredTracks)))
    );
  }

  await Promise.all(promises);
  transferSuccess.set(true);
}
