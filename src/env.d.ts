/// <reference types="astro/client" />
declare let MusicKit: any;

declare type PlaylistSelect = {
  playlist: AppleMusicApi.Playlist;
  selected: boolean;
};

type SongReview = {
  appleSong: AppleMusicApi.Song;
  spotifySong: SpotifyApi.TrackObjectFull | undefined;
};

type PlaylistReview = {
  playlist: AppleMusicApi.Playlist;
  tracks: Array<SongReview>;
};

interface PRS {
  review: PlaylistReview;
  selected: boolean;
}
