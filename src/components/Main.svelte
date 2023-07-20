<script lang="ts">
  import { onMount } from "svelte";
  import {
    apple_authenticated,
    spotify_access_token,
    spotify_expired,
    errorState,
  } from "../utils/storable";
  import ErrorModal from "./ErrorModal.svelte";
  import Header from "./Header.svelte";
  import Playlists from "./Playlists.svelte";
  import SpotifyButton from "./SpotifyButton.svelte";
  import Transfer from "./Transfer.svelte";
  import Footer from "./Footer.svelte";

  let musickiterror = false;
  let musickitloaded = false;

  onMount(() => {
    if (!MusicKit) console.log("Not Loaded Yet!");
    else {
      console.log("Music Kit loaded in svelte");
      try {
        const music = MusicKit.getInstance();
        apple_authenticated.set(music.isAuthorized);
      } catch (err) {
        console.log(err);
      }
      musickitloaded = true;
    }
  });

  async function authorizeApple() {
    const music = MusicKit.getInstance();
    if (!apple_authenticated.get()) {
      try {
        await music.authorize();
        apple_authenticated.set(true);
      } catch (err) {
        console.log(err);
        musickiterror = true;
        apple_authenticated.set(false);
      }
    }
  }
</script>

<div class="flex flex-col relative h-screen">
  {#if musickiterror}
    <ErrorModal
      reload={true}
      show={musickiterror}
      text={"Please reload the page to enable Apple MusicKit"}
    />
  {/if}
  {#if $errorState.status !== 200}
    <ErrorModal
      reload={true}
      show={$errorState.status !== 200}
      text={`Error Code: ${$errorState.status}. Description: ${$errorState.text}`}
    />
  {/if}
  {#if !$spotify_access_token || $spotify_expired || !$apple_authenticated}
    <div class="flex absolute left-0 right-0">
      <Header />
    </div>
    <div class="flex-1 flex flex-col justify-center items-center">
      <div class="flex flex-col gap-3">
        {#if !$spotify_access_token || $spotify_expired}
          <SpotifyButton />
        {:else}
          <div
            class=" bg-black text-white font-bold py-3 px-5 rounded-md inline-flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 256 256"
              ><path
                fill="#1ED760"
                d="M128 0C57.308 0 0 57.309 0 128c0 70.696 57.309 128 128 128c70.697 0 128-57.304 128-128C256 57.314 198.697.007 127.998.007l.001-.006Zm58.699 184.614c-2.293 3.76-7.215 4.952-10.975 2.644c-30.053-18.357-67.885-22.515-112.44-12.335a7.981 7.981 0 0 1-9.552-6.007a7.968 7.968 0 0 1 6-9.553c48.76-11.14 90.583-6.344 124.323 14.276c3.76 2.308 4.952 7.215 2.644 10.975Zm15.667-34.853c-2.89 4.695-9.034 6.178-13.726 3.289c-34.406-21.148-86.853-27.273-127.548-14.92c-5.278 1.594-10.852-1.38-12.454-6.649c-1.59-5.278 1.386-10.842 6.655-12.446c46.485-14.106 104.275-7.273 143.787 17.007c4.692 2.89 6.175 9.034 3.286 13.72v-.001Zm1.345-36.293C162.457 88.964 94.394 86.71 55.007 98.666c-6.325 1.918-13.014-1.653-14.93-7.978c-1.917-6.328 1.65-13.012 7.98-14.935C93.27 62.027 168.434 64.68 215.929 92.876c5.702 3.376 7.566 10.724 4.188 16.405c-3.362 5.69-10.73 7.565-16.4 4.187h-.006Z"
              /></svg
            >
            <span class="ml-2">Signed in Successfully!</span>
          </div>
        {/if}
        {#if !$apple_authenticated}
          <button
            class="bg-white hover:bg-gray-300 text-gray-600 font-bold py-3 px-5 rounded-md inline-flex items-center"
            on:click={authorizeApple}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              ><path
                fill="currentColor"
                d="M24.32 10.85c-1.743 1.233-2.615 2.72-2.615 4.455c0 2.08 1.078 3.673 3.232 4.786c-.578 1.678-1.416 3.135-2.514 4.376c-1.097 1.24-2.098 1.862-3.004 1.862c-.428 0-1.01-.143-1.75-.423l-.353-.138c-.725-.28-1.363-.423-1.92-.423c-.525 0-1.1.11-1.725.33l-.445.16l-.56.23c-.44.176-.888.264-1.337.264c-1.06 0-2.228-.872-3.507-2.616c-1.843-2.498-2.764-5.22-2.764-8.167c0-2.095.573-3.78 1.724-5.06c1.15-1.28 2.673-1.92 4.568-1.92c.71 0 1.37.13 1.988.388l.423.172l.445.183c.396.167.716.25.96.25c.31 0 .658-.07 1.04-.216l.58-.23l.436-.16c.693-.25 1.46-.376 2.297-.376c1.992 0 3.59.758 4.8 2.274zm-4.705-7.563c.02.267.033.473.033.617c0 1.317-.48 2.473-1.438 3.467s-2.075 1.49-3.347 1.49a5.807 5.807 0 0 1-.058-.638c0-1.12.445-2.17 1.337-3.153c.89-.983 1.922-1.56 3.096-1.726c.082-.015.21-.033.377-.057z"
              /></svg
            >
            <span>Log in to Apple Music</span>
          </button>
        {:else}
          <div
            class=" bg-gray-300 text-gray-600 font-bold py-3 px-5 rounded-md inline-flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              ><path
                fill="currentColor"
                d="M24.32 10.85c-1.743 1.233-2.615 2.72-2.615 4.455c0 2.08 1.078 3.673 3.232 4.786c-.578 1.678-1.416 3.135-2.514 4.376c-1.097 1.24-2.098 1.862-3.004 1.862c-.428 0-1.01-.143-1.75-.423l-.353-.138c-.725-.28-1.363-.423-1.92-.423c-.525 0-1.1.11-1.725.33l-.445.16l-.56.23c-.44.176-.888.264-1.337.264c-1.06 0-2.228-.872-3.507-2.616c-1.843-2.498-2.764-5.22-2.764-8.167c0-2.095.573-3.78 1.724-5.06c1.15-1.28 2.673-1.92 4.568-1.92c.71 0 1.37.13 1.988.388l.423.172l.445.183c.396.167.716.25.96.25c.31 0 .658-.07 1.04-.216l.58-.23l.436-.16c.693-.25 1.46-.376 2.297-.376c1.992 0 3.59.758 4.8 2.274zm-4.705-7.563c.02.267.033.473.033.617c0 1.317-.48 2.473-1.438 3.467s-2.075 1.49-3.347 1.49a5.807 5.807 0 0 1-.058-.638c0-1.12.445-2.17 1.337-3.153c.89-.983 1.922-1.56 3.096-1.726c.082-.015.21-.033.377-.057z"
              /></svg
            >
            <span>Signed in Successfully!</span>
          </div>
        {/if}
      </div>
    </div>
  {:else if musickitloaded}
    <div class="flex left-0 right-0">
      <Header />
    </div>
    <div
      class="flex-1 flex flex-col md:flex-row px-6 pt-6 self-center md:self-start justify-center md:justify-start md:overflow-hidden"
    >
      <Playlists />
      <Transfer />
    </div>
  {/if}
  <Footer />
</div>
