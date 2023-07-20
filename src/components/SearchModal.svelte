<!-- https://geon.github.io/programming/2016/02/24/flexbox-full-page-web-app-layout -->
<script lang="ts">
  import {
    searchSong,
    spotify_access_token,
  } from "../utils/storable";
  import SpotifyWebApi from "spotify-web-api-js";
  // @ts-ignore
  import AutoComplete from "./AutoComplete.svelte";
  import Modal from "./Modal.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  const spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(spotify_access_token.get());

  const sendBackToTransfer = () => {
    dialog.close();
    dispatch("sendBackToTransfer", selectedTrack);
    selectedTrack = undefined;
  };

  export let show: boolean;

  let dialog: HTMLDialogElement;
  let selectedTrack: SpotifyApi.TrackObjectFull | undefined;
</script>

<Modal showModal={show} bind:dialog>
  <div class="flex-1 bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 flex flex-col overflow-hidden">
    <div class="sm:flex sm:items-start overflow-scroll">
      <div
        class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5q0-2.725 1.888-4.612T9.5 3q2.725 0 4.612 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3l-1.4 1.4ZM9.5 14q1.875 0 3.188-1.313T14 9.5q0-1.875-1.313-3.188T9.5 5Q7.625 5 6.312 6.313T5 9.5q0 1.875 1.313 3.188T9.5 14Z"
          /></svg
        >
      </div>
      <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left overflow-scroll">
        <h3
          class="text-base font-semibold leading-6 text-gray-900"
          id="modal-title"
        >
          Search for the correct version of {$searchSong?.appleSong.attributes
            ?.name} by {$searchSong?.appleSong.attributes?.artistName}
        </h3>
        {#if selectedTrack}
          <br />
          <p class="font-bolded font-medium">Selected:</p>
          <div class="flex items-center">
            <div class="flex items-center h-12">
              <img
                class="h-12 w-12 flex-none bg-gray-50"
                src={selectedTrack.album.images[0]?.url}
                alt=""
              />
              <div class="flex flex-col px-4">
                <p class="text-sm font-semibold uppercase">
                  {selectedTrack.name} by {selectedTrack.artists[0]?.name}
                </p>
              </div>
            </div>
          </div>
        {/if}
        <div class="flex flex-col mt-2 overflow-scroll">
          <AutoComplete 
            delay={200}
            bind:selectedTrack
          />
        </div>
      </div>
    </div>
  </div>
  <div class="bg-gray-50 px-4 py-3 flex flex-col md:flex-row-reverse md:px-6">
    <button
      type="button"
      on:click={sendBackToTransfer}
      class="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-800 md:ml-3 md:w-auto"
      >Submit</button
    >
    <div class="h-3">
    </div>
    <button
      type="button"
      on:click={() => {
        dialog.close();
        selectedTrack = undefined;
        searchSong.set(undefined);
      }}
      class="inline-flex w-full justify-center rounded-md bg-gray-400 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 md:ml-3 md:w-auto"
      >Cancel</button
    >
  </div>
</Modal>
