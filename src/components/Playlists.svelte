<script lang="ts">
  import { applePlaylists, errorState, playlistSelected } from "../utils/storable";
  
  const querySize = 10;
  async function fetchApplePlaylists() {
    const music = MusicKit.getInstance();
    let hasNextPage = true;
    while (hasNextPage) {
      const queryParameters = {
        limit: querySize,
        offset: applePlaylists.get().length,
      };

      // Make a request for the next page
      const response = await music.api.music(
        "v1/me/library/playlists",
        queryParameters
      );
      if (response.response.status != 200) {
        errorState.set({
          status: response.response.status,
          text: response.response.statusText,
        });
      }
      const temp: Array<PlaylistSelect> = [];
      for (const playlist of response.data.data) {
        temp.push({ playlist: playlist, selected: false });
      }
      applePlaylists.set([...applePlaylists.get(), ...temp]);
      // Cast the `next` property to a boolean, where `undefined`
      // becomes `false`, but any URL value would be `true`
      //
      // When this is `false`, then the loop stops
      hasNextPage = !!response.data.next;
    }
  }

  let promise = fetchApplePlaylists();

  $: {
    const temp = playlistSelected.get().sort((a, b) =>
      (a.attributes?.name || "").localeCompare(b.attributes?.name || "")
    );
    playlistSelected.set(temp);
  }
</script>

<div class="flex flex-col items-center justify-start pr-6 overflow-hidden">
  <p class="font-semibold text-lg">
    Selected {$playlistSelected.length} playlist{$playlistSelected.length !== 1
      ? "s"
      : ""} to transfer
  </p>
  {#await promise}
    <div role="status" class="self-center">
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
  <ul class="flex-1 overflow-scroll divide-y divide-gray-200">
    {#each $applePlaylists as item (item.playlist.id)}
      <label
        class="flex justify-between w-full gap-x-6 py-5 transition ease-in-out hover:bg-slate-500"
      >
        <input
          type="checkbox"
          bind:group={$playlistSelected}
          value={item.playlist}
          bind:checked={item.selected}
          class="appearance-none"
        />
        <div class="flex items-start gap-x-4 px-4">
          <img
            class="h-12 w-12 flex-none bg-gray-50"
            src={item.playlist.attributes?.artwork
              ? item.playlist.attributes?.artwork.url
              : "/blank_album.png"}
            alt=""
          />
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-6 text-gray-900">
              {item.playlist.attributes?.name}
            </p>
            <p class="mt-1 truncate text-xs leading-5 text-gray-9900">
              {item.playlist.attributes?.description?.standard}
            </p>
          </div>
        </div>
        <div class="ml-auto">
          {#if item.selected}
            <svg
              class="mr-3"
              xmlns="http://www.w3.org/2000/svg"
              width="50"
              height="50"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="m9.55 18l-5.7-5.7l1.425-1.425L9.55 15.15l9.175-9.175L20.15 7.4L9.55 18Z"
              /></svg
            >
          {/if}
        </div>
      </label>
    {/each}
  </ul>
</div>
