<!-- https://geon.github.io/programming/2016/02/24/flexbox-full-page-web-app-layout -->
<script lang="ts">
  import {
  playlistReviews,
    playlistSelected,
    searchSong,
    transferSuccess,
    progress,
    totalProgress,
    eta,
    readingApplePlaylist,
    currentPlaylistTransfered,
  } from "../utils/storable";
  import { transfer, transferToSpotify } from "../utils/transfer";
  import SearchModal from "./SearchModal.svelte";
  import SuccessModal from "./SuccessModal.svelte";

  let showEverything = false;
  let promise = startTransfer();
  async function startTransfer() {
    const sel = playlistSelected.get();
    // don't fetch playlists that have already been fetched
    const playlistIdsAlreadyInPR = playlistReviews.get().map(pr => pr.review.playlist.id)
    const filteredPR = sel.filter(p => !playlistIdsAlreadyInPR.includes(p.id));
    const reviews = await transfer(filteredPR);
    let pr = reviews.map((review: PlaylistReview) => {
      return {
        review: review,
        selected: true,
      };
    });
    let temp = [...playlistReviews.get(), ...pr];
    // remove playlists that are unselected
    const selIds = sel.map((s) => s.id);
    temp = temp.filter(p => selIds.includes(p.review.playlist.id));
    playlistReviews.set(temp);
  }

  function numberOfUnknown(pr: PlaylistReview) {
    return pr.tracks.filter((t) => t.spotifySong === undefined).length
  }

  function updateTransfer(event: any) {
    const temp = playlistReviews.get();
    for (const prs of temp) {
      for (const track of prs.review.tracks) {
        if (track.appleSong.id === $searchSong?.appleSong.id) {
          track.spotifySong = event.detail;
        }
      }
    }
    playlistReviews.set([...temp]);
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

<div class="flex-1 flex flex-col overflow-hidden p-4 justify-start">
  <div class="block">
    {#if $playlistReviews.length > 0 || $playlistSelected.length > 0}
      <button
        class="md:self-start text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
        on:click={() => (promise = startTransfer())}
        >Find Equivalent Songs for Selected Playlists on Spotify</button
      >
    {/if}
    {#if $playlistReviews.length > 0}
      <button
        class="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
        on:click={transferAllPlaylists}>Transfer All Playlists</button
      >
      <div class="flex items-center">
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
  </div>
  {#await promise}
    <div class="{$playlistReviews.length < 1 ? "flex-1 justify-center" : '' } flex flex-col">
      {#if $currentPlaylistTransfered !== undefined}
        <p class="font-bold text-xl leading-5">Finding songs from Playlist: {$currentPlaylistTransfered?.attributes?.name}</p>
      {/if}
      {#if $readingApplePlaylist}
        <p class="font-semibold text-md text-gray-600">Reading your Apple Playlist. This will take a moment. Please wait...</p>
      {:else}
        <label for="transfer-progress" id="sr-only" class="font-semibold text-md text-gray-600">Progress:</label>
        <progress id="transfer-progress" value={$progress} max={$totalProgress} class="[&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg   [&::-webkit-progress-bar]:bg-slate-300 [&::-webkit-progress-value]:bg-green-600 [&::-moz-progress-bar]:bg-green-600"></progress>
        {#if $eta > 0} 
        <p class="font-semibold text-md text-gray-600">ETA: {Math.floor( ($eta / 1000) / 60)} min and { Math.floor(($eta / 1000) % 60)} sec </p>
        <p class="font-thin text-sm text-gray-600">Slow Process necessary due to Spotify Api rate limits</p>
        {/if}
      {/if}
    </div>
  {/await}
  {#if $playlistReviews.length > 0}
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
              {review.review.tracks.length} song{review.review.tracks.length > 1 ? "s" : ""}
            </p>
          </div>
          <p>{numberOfUnknown(review.review)} songs have not been found</p>
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
  {/if}
</div>
