<script>
	import { onMount } from 'svelte';

   let showHelp = false;
   let scale = "medium";
   let appContainer;

   const toggleHelp = () => showHelp = !showHelp;

   const getScale = function(width, height) {
      if (width < 959) return "small";
      if (width < 1279) return "medium";
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


   //$: buttonTitle = showHelp ? "Back to app" : "Click for help";
   //$: buttonIcon = showHelp ? "×" : "?";
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

   min-width: 800px;
   max-width: 2560px;
   max-height: 1800px;
   min-height: 720px;

   width: 100%;
   height: 100%;

   box-sizing: border-box;
   padding: 1em;
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
   padding: 1em;
   line-height: 1.35em;
   font-size: 1em;
   color: #303030;
}

.helptext :global(h2) {
   padding: 0.25em 0 0.5em 0;
}

.helptext :global(p) {
   padding: 0 0 0.5em 0;
   line-height: 1.5em;
   font-size: 1.2em;
}


/* styles for medium app size - between 900 and 1200 */
.mdatools-app_medium {
   font-size: 14px;
   max-height: 720px;
   min-height: 540px;
}

/* styles for small app size */
.mdatools-app_small {
   max-height: 540px;
   min-height: 450px;
   font-size: 12px;
}

.mdatools-app_small :global(.axis-label) {
   text-align: center;
   font-weight: 500;
   font-size: 1.25em;
}

</style>