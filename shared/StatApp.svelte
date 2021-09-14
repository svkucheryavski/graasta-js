<script>
	import { onMount } from 'svelte';

   let showHelp = false;
   let scale = "medium";
   let appContainer;

   const toggleHelp = () => showHelp = !showHelp;

   const getScale = function(width, height) {
      if (width < 800) return "small";
      if (width < 1200) return "medium";
      return "large";
   };

   /* observer for the plotting area size */
   var ro = new ResizeObserver(entries => {
      for (let entry of entries) {
         const cr = entry.contentRect;
         scale = getScale(cr.width, cr.height);
      }
   });

   const handleKeyPress = e => {
      if (e.key === 'h') toggleHelp();
   };

   onMount(() => {
      ro.observe(appContainer);
   });

   $: buttonTitle = showHelp ? "Back to app" : "Click for help";
   $: buttonIcon = showHelp ? "×" : "?";
</script>

<svelte:window on:keypress={handleKeyPress}/>
<main class="mdatools-app mdatools-app_{scale}" bind:this={appContainer}>

   {#if !showHelp}
   <div class="content">
   <slot></slot>
   </div>

   {:else}
   <div class="helptext">
      <slot name="help"></slot>
   </div>
   {/if}

   <button class="help-button" title="{buttonTitle}" on:click|preventDefault="{toggleHelp}">{buttonIcon}</button>
</main>

<style>

/* main styles for mdatools-app and children */
:global(#mdatools-app-container) {
   height: 100% !important;
   width: 100% !important;
}

.mdatools-app {
   font-family: Helvetica, Areal, Verdana, sans-serif;
   display: block;
   position: relative;
   font-size: 18px;

   max-width: 2560px;
   max-height: 1800px;
   min-width: 640px;
   min-height: 675px;

   width: 100%;
   height: 100%;

   box-sizing: border-box;
   padding: 2em;
   margin: 0 auto;
   background: #fdfdfd;
}

.mdatools-app  * {
   box-sizing: border-box;
   margin: 0;
   padding: 0;
}

.mdatools-app :glbal(.plot) {
   box-shadow: 0px 0px 5px  #30303020;
}

.mdatools-app .content {
   width: 100%;
   height: 100%;
}

/* help text and button */

.helptext {
   width: 100%;
   height: 100%;
   padding: 2em;
   line-height: 1.35em;
   font-size: 1em;
   color: #303030;
}

.helptext :global(h2) {
   padding: 1.0em 0 1em 0;
}

.helptext :global(p) {
   padding: 0 0 0.5em 0;
   line-height: 1.5em;
   font-size: 1.2em;
}

.help-button {
   width: 30px;
   height: 30px;

   box-sizing: border-box;
   position: absolute;
   right: 0;
   bottom: 0;
   margin: 0.25em;
   background: transparent;
   border: none;
   cursor: pointer;
   font-weight: bold;
   font-size: 1.2em;
   border-radius: 50%;
   color: #a0a0a0;
   line-height: 30px;
}


.help-button:hover {
   background: #606060;
   color: #f6f6f6;
}

/* styles for medium app size - between 800 and 1200 */
.mdatools-app_medium {
   font-size: 14px;
   min-height: 450px;
   max-height: 675px;
}

.mdatools-app_small .help-button {
   width: 25px;
   height: 25px;
   line-height: 25px;
}

/* styles for small app size */
.mdatools-app_small {
   max-height: 450px;
   min-height: 360px;
   font-size: 12px;
}

.mdatools-app_small :global(.axis-label) {
   text-align: center;
   font-weight: 500;
   font-size: 1.25em;
}

.mdatools-app_small .help-button {
   width: 20px;
   height: 20px;
   line-height: 20px;
}

</style>