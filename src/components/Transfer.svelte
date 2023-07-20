<script lang="ts">
  import {
  playlistReviews,
    playlistSelected,
    searchSong,
    transferSuccess,
  } from "../utils/storable";
  import { transfer, transferToSpotify } from "../utils/transfer";
  import SearchModal from "./SearchModal.svelte";
  import SuccessModal from "./SuccessModal.svelte";

  let showEverything = false;
  let promise = startTransfer();
  async function startTransfer() {
    const sel = playlistSelected.get();
    const playlistIdsAlreadyInPR = playlistReviews.get().map(pr => pr.review.playlist.id)
    const filteredPR = sel.filter(p => !playlistIdsAlreadyInPR.includes(p.id));
    const reviews = await transfer(filteredPR);
    let pr = reviews.map((review: PlaylistReview) => {
      return {
        review: review,
        selected: true,
      };
    });
    playlistReviews.set([...playlistReviews.get(), ...pr]);
  }
  function updateTransfer(event: any) {
    for (const prs of playlistReviews.get()) {
      for (const track of prs.review.tracks) {
        if (track.appleSong.id === $searchSong?.appleSong.id) {
          track.spotifySong = event.detail;
        }
      }
    }
    playlistReviews.set(playlistReviews.get());
    searchSong.set(undefined);
  }
  async function transferAllPlaylists() {
    let promises = [];
    for (const prs of playlistReviews.get()) {
      promises.push(transferToSpotify(prs.review));
    }
    Promise.all(promises);
  }
</script>

<SuccessModal show={$transferSuccess} />
<SearchModal
  on:sendBackToTransfer={updateTransfer}
  show={$searchSong !== undefined}
/>

<div class="flex flex-col overflow-hidden p-4 justify-center">
  {#if $playlistSelected.length > 0}
    <button
      class="md:self-start text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
      on:click={() => (promise = startTransfer())}
      >Find Equivalent Songs on Spotify</button
    >
  {/if}
  {#if $playlistReviews.length > 0}
    <button
      class="md:self-start text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
      on:click={transferAllPlaylists}>Transfer All Playlists</button
    >
  {/if}
  {#if $playlistSelected.length > 0}
    <div class="flex md:self-start items-center">
      <input
        id="link-checkbox"
        type="checkbox"
        bind:checked={showEverything}
        value=""
        class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
      />
      <label for="link-checkbox" class="ml-2 text-sm font-medium text-gray-900"
        >Show All Tracks</label
      >
    </div>
  {/if}
  {#await promise}
    <div role="status" class="md:self-center">
      <svg
        aria-hidden="true"
        class="w-24 h-24 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-green-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
      <span class="sr-only">Loading...</span>
    </div>
  {/await}
  <ul class="flex-1 flex flex-col divide-y divide-gray-200 overflow-scroll">
    {#each $playlistReviews as review}
      <li class="flex-none overflow-scroll p-2">
        <div class="flex gap-x-4 p-4">
          <img
            class="h-12 w-12 flex-none"
            src={review.review.playlist.attributes?.artwork
              ? review.review.playlist.attributes?.artwork.url
              : "/blank_album.png"}
            alt=""
          />
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">
              {review.review.playlist.attributes?.name}
            </p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-9900">
              {review.review.tracks.length} song{review.review.tracks.length > 1
                ? "s"
                : ""}
            </p>
          </div>
          <button
            class=" text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            on:click={() => transferToSpotify(review.review)}
            >Transfer Playlist</button
          >
        </div>
        <ul
          class="flex-none flex flex-col w-auto ml-10 overflow-scroll divide-y divide-gray-200 gap-1"
        >
          {#each review.review.tracks as track}
            {#if track.spotifySong == undefined}
              <button
                on:click={() => {
                  searchSong.set(track);
                }}
                class="overflow-scroll flex justify-start items-center bg-red-200 hover:bg-red-400 rounded p-2 gap-3"
              >
                <div class="flex flex-col justify-start items-start">
                  <p>
                    {track.appleSong.attributes?.name} by {track.appleSong
                      .attributes?.artistName}
                  </p>
                  <p>{track.appleSong.attributes?.albumName}</p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 15 15"
                  ><path
                    fill="currentColor"
                    d="M8.293 2.293a1 1 0 0 1 1.414 0l4.5 4.5a1 1 0 0 1 0 1.414l-4.5 4.5a1 1 0 0 1-1.414-1.414L11 8.5H1.5a1 1 0 0 1 0-2H11L8.293 3.707a1 1 0 0 1 0-1.414Z"
                  /></svg
                >
                <p>Nothing Found :(</p>
              </button>
            {:else if showEverything}
              <div
                class="flex-none overflow-scroll flex justify-start items-center bg-gray-300 rounded p-2 gap-3"
              >
                <div class="flex flex-col justify-start">
                  <p>
                    {track.appleSong.attributes?.name} by {track.appleSong
                      .attributes?.artistName}
                  </p>
                  <p>{track.appleSong.attributes?.albumName}</p>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 15 15"
                  ><path
                    fill="currentColor"
                    d="M8.293 2.293a1 1 0 0 1 1.414 0l4.5 4.5a1 1 0 0 1 0 1.414l-4.5 4.5a1 1 0 0 1-1.414-1.414L11 8.5H1.5a1 1 0 0 1 0-2H11L8.293 3.707a1 1 0 0 1 0-1.414Z"
                  /></svg
                >
                <div class="flex flex-col">
                  <p>
                    {track.spotifySong.name} by {track.spotifySong.artists.map(
                      (artist) => artist.name
                    )}
                  </p>
                  <p>{track.spotifySong.album.name}</p>
                </div>
              </div>
            {/if}
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
</div>
