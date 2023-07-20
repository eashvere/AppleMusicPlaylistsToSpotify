<script>
  import { searchSong, transferSuccess } from "../utils/storable";

  export let showModal; // boolean
  export let dialog; // HTMLDialogElement

  $: if (dialog && showModal) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
  bind:this={dialog}
  on:close={() => {
    showModal = false;
    searchSong.set(undefined);
    transferSuccess.set(false);
  }}
  on:click|self={() => {
    dialog.close();
    searchSong.set(undefined);
    transferSuccess.set(false);
  }}
  class="items-center z-50 h-[calc(100vh-74px)] open:flex open:flex-col rounded-sm border-none overflow-hidden"
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div on:click|stopPropagation class="flex-1 flex flex-col overflow-hidden">
    <slot />
  </div>
</dialog>

<style>
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.3);
  }
  dialog[open] {
    animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes zoom {
    from {
      transform: scale(0.95);
    }
    to {
      transform: scale(1);
    }
  }
  dialog[open]::backdrop {
    animation: fade 0.2s ease-out;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
