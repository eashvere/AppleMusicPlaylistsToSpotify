<!-- Borrowed some functionality from simple-svelte-autocomplete -->
<script lang="ts">
  import {
    Combobox,
    ComboboxInput,
    ComboboxOptions,
    ComboboxOption,
  } from "svelte-headlessui-combobox-temporary";
  import { apiWrapper } from "../utils/transfer";
  import SpotifyWebApi from "spotify-web-api-js";
  import { spotify_access_token } from "../utils/storable";
  import { fade } from "svelte/transition";

  export let text: string = "";
  export let delay = 0;
  export let maxItemsToShowInList = 10;
  export let selectedTrack: SpotifyApi.TrackObjectFull | undefined;
  export let loadingEnabled = true;

  let inputDelayTimeout: number;
  let lastRequestId = 0;
  let lastResponseId = 0;
  let loading = false;
  let searchedTracks: SpotifyApi.TrackObjectFull[] = [];

  function onInput(e: CustomEvent) {
    text = (e.target as HTMLInputElement).value;
    if (inputDelayTimeout) {
      clearTimeout(inputDelayTimeout);
    }

    if (delay) {
      inputDelayTimeout = setTimeout(search, delay);
    } else {
      search();
    }
  }

  function prepareUserEnteredText(userEnteredText: string) {
    const textFiltered = userEnteredText
      .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, " ")
      .trim();
    const textTrimmed = textFiltered.toLowerCase().trim();

    return textTrimmed;
  }

  async function search() {
    let textFiltered = prepareUserEnteredText(text);

    if (textFiltered === "") {
      searchedTracks = [];
      return;
    }

    lastRequestId += 1;
    const currentRequestId = lastRequestId;
    loading = true;

    let result = await querySong(textFiltered, maxItemsToShowInList);

    // If a response to a newer request has been received
    // while responses to this request were being loaded,
    // then we can just throw away this outdated results.
    if (currentRequestId < lastResponseId) {
      return;
    }

    lastResponseId = currentRequestId;
    searchedTracks = result;

    loading = false;
  }

  const spotifyApi = new SpotifyWebApi();
  spotifyApi.setAccessToken(spotify_access_token.get());
  const querySong = async (song: string, limit: number) => {
    const data = await apiWrapper(
      spotifyApi.searchTracks(song, { limit: limit })
    );
    return data.tracks.items;
  };
</script>

<Combobox value={selectedTrack} on:change={(e) => (selectedTrack = e.detail)} class="flex-1 overflow-scroll" let:open>
  <ComboboxInput on:input={onInput} class="w-full p-2.5 leading-8 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-0 focus:ring-green-500 focus:border-green-500"/>
  {#if loadingEnabled && loading}
    <div role="status" class="md:self-center mt-3">
      <svg
        aria-hidden="true"
        class="mx-auto w-24 h-24 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-green-600"
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
  {:else}
    {#if open}
    <div class="flex flex-col overflow-scroll" transition:fade={{duration: 100}}>
    <ComboboxOptions static class="overflow-scroll mt-1">
      {#each searchedTracks as item (item)}
        <ComboboxOption value={item}>
          <div class="flex items-center my-2 p-1 border-2 border-green-400 rounded-sm hover:bg-gray-400">
            <div class="flex items-center h-12">
              <img
                class="h-12 w-12 flex-none bg-gray-50"
                src={item.album.images[0]?.url}
                alt=""
              />
              <div class="flex flex-col px-4">
                <p class="text-sm font-semibold uppercase">
                  {item.name} by {item.artists[0]?.name}
                </p>
              </div>
            </div>
          </div>
        </ComboboxOption>
      {/each}
    </ComboboxOptions>
    </div>
    {/if}
  {/if}
</Combobox>
