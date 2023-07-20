<script lang="ts">
  import { transferSuccess } from "../utils/storable";
  import Modal from "./Modal.svelte";

  let dialog: HTMLDialogElement;
  export let show: boolean;
</script>

<Modal showModal={show} bind:dialog>
  <div class="flex-1 bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 flex flex-col">
    <div class="sm:flex sm:items-start">
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
      <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
        <h3
          class="text-base font-semibold leading-6 text-gray-900"
          id="modal-title"
        >
          Success! 🎉🎉🎉🎉
        </h3>
        <div class="mt-2">Successfully transfered your playlists!</div>
      </div>
    </div>
  </div>
  <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
    <button
      type="button"
      on:click={() => {
        dialog.close();
        transferSuccess.set(false);
      }}
      class="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
      >Close</button
    >
  </div>
</Modal>
