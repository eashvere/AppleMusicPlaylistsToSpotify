import { setPersistentEngine, persistentAtom } from "@nanostores/persistent";
import type { PersistentListener } from "@nanostores/persistent";
import { atom } from "nanostores";

let listeners: Array<PersistentListener> = [];
// Must implement addEventListener and removeEventListener
const events = {
  addEventListener(key: string, callback: PersistentListener) {
    listeners.push(callback);
  },
  removeEventListener(key: string, callback: PersistentListener) {
    listeners = listeners.filter((i) => i !== callback);
  },
  // window dispatches "storage" events for any key change
  // => One listener for all map keys is enough
  perKey: false,
};

setPersistentEngine(sessionStorage, events);

export const verifierStore = persistentAtom<string>("verifier", "", {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const spotify_access_token = persistentAtom<string>(
  "spotify_access_token",
  "",
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const spotify_expired = persistentAtom<boolean>(
  "spotify_expired",
  true,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const apple_authenticated = persistentAtom<boolean>(
  "apple_auth",
  false,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const applePlaylists = persistentAtom<PlaylistSelect[]>(
  "applePlaylists",
  [],
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export const playlistSelected = persistentAtom<Array<AppleMusicApi.Playlist>>(
  "playlistSelected",
  [],
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);



// export const playlistReviews = persistentAtom<PRS[]>(
//   "playlistReviews",
//   [],
//   {
//     encode: JSON.stringify,
//     decode: JSON.parse,
//   }
// );

export const playlistReviews = atom<PRS[]>([]);

export const rollingRequests = persistentAtom<number>(
  "rollingRequests",
  0,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

type ResponseError = {
  status: number;
  text: string;
};

export const errorState = atom<ResponseError>({ status: 200, text: "" });
export const searchSong = atom<SongReview | undefined>(undefined);
export const transferSuccess = atom<boolean>(false);
export const progress = atom<number>(0);
export const totalProgress = atom<number>(1);
export const eta = atom<number>(0);
export const readingApplePlaylist = atom<boolean>(false);
export const currentPlaylistTransfered = atom<AppleMusicApi.Playlist | undefined>(undefined);