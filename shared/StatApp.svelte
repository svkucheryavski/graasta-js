<script>
	import { onMount } from 'svelte';

   let showHelp = false;
   let scale = "medium";
   let appContainer;

   const toggleHelp = () => showHelp = !showHelp;

   const getScale = function(width, height) {
      if (height < 450 || width < 800) return "small";
      if (height < 675 || width < 1200) return "medium";
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

</script>

<svelte:window on:keypress={handleKeyPress}/>
<main class="mdatools-app mdatools-app_{scale}" bind:this={appContainer}>

   {#if !showHelp}
   <div class="mdatools-app__content">
   <slot></slot>
   </div>

   {:else}
   <div class="mdatools-app__helptext">
      <slot name="help"></slot>
   </div>
   {/if}

   <button class="mdatools-app__help-button" title="{showHelp ? "Back to app" : "Click for help"}" on:click|preventDefault="{toggleHelp}">{showHelp ? "×" : "?"}</button>
</main>

<style>

/* main styles for mdatools-app and children */
:global(#mdatools-app-container) {
   height: 100% !important;
   width: 100% !important;
}

:global(.mdatools-app) {
   font-family: Helvetica, Areal, Verdana, sans-serif;
   display: block;
   position: relative;

   min-width: 640px;
   min-height: 360px;
   max-width: 2560px;
   max-height: 1800px;

   width: 100%;
   height: 100%;

   box-sizing: border-box;
   padding: 2em;
   margin: 0 auto;
   background: #fafafa;
}

:global(.mdatools-app  *) {
   box-sizing: border-box;
   margin: 0;
   padding: 0;
}

:global(.mdatools-app .plot) {
   box-shadow: 0px 0px 5px  #30303020;
}

/* size related styles  */
:global(.mdatools-app_small) {
   font-size: 12px;
}

:global(.mdatools-app_medium) {
   font-size: 14px;
}

:global(.mdatools-app_large) {
   font-size: 18px;
}

:global(.mdatools-app__content) {
   width: 100%;
   height: 100%;
}

:global(.mdatools-app .app-layout) {
   display: grid;
   height: 100%;
   width: 100%;
   margin: 0 auto;
   grid-gap: 2em;
}

/* help text and button */

:global(.mdatools-app__helptext) {
   width: 100%;
   height: 100%;
   padding: 2em;
   line-height: 1.35em;
   font-size: 1em;
   color: #303030;
}

:global(.mdatools-app__helptext  h2) {
   padding: 1.0em 0 1em 0;
}

:global(.mdatools-app__helptext  p) {
   padding: 0 0 0.5em 0;
   line-height: 1.5em;
   font-size: 1.2em;
}

:global(.mdatools-app__help-button) {
   box-sizing: border-box;
   position: absolute;
   right: 0;
   bottom: 0;
   margin: 0.25em;
   background: transparent;
   border: none;
   cursor: pointer;
   font-weight: bold;
   font-size: 1.1em;
   border-radius: 50%;
   color: #a0a0a0;
}

:global(.mdatools-app_small  .mdatools-app__help-button) {
   width: 20px;
   height: 20px;
 }

:global(.mdatools-app_medium  .mdatools-app__help-button) {
   width: 25px;
   height: 25px;
 }

:global(.mdatools-app_large  .mdatools-app__help-button) {
   width: 30px;
   height: 30px;
 }

:global(.mdatools-app__help-button:hover) {
   background: #606060;
   color: #f6f6f6;
}

:global(.mdatools-app .axis-label) {
   text-align: center;
   font-weight: 500;
   font-size: 1.25em;
}

/* control elements */

:global(.mdatools-app .app-controls-area) {
   display: flex;
   flex-direction: column;
   justify-content: flex-end;
   align-content: center;
}

:global(.mdatools-app .app-controls-area > fieldset) {
   background: #f4f4f4;
   box-shadow: 0px 0px 5px  #30303020;
   border: none;
}

:global(.mdatools-app .app-control) {
   font-size: 1em;
   margin: 0.25em 0 0 0;
   padding: 0.25em 0.5em;
   display: flex;
   align-items: center;
   justify-content: flex-begin;
}

:global(.app-control > label) {
  flex: 1 0 120px;
  max-width: 100px;
}

:global(.app-control > button) {
   font-size: 0.9em;
   padding: 0.35em 1em;
   margin: 0 0.5em;
   color: #606060;
   background: #e0e0e0;
   box-shadow: none;
   border: none;
   border-radius: 3px;
}

:global(.app-control > button:hover) {
   color: #fafafa;
   background: #606060;

}

:global(.mdatools-app_large .app-control > label) {
   flex: 1 0 150px;
   max-width: 150px;
}

:global(.app-control > input, .app-control > select) {
   font-family:inherit;
   font-size: inherit;
   font-size: 0.9em;
   background: #fff;
   border: solid 1px #e0e0e0;
   padding: 0.25em;
   border-radius: 3px;
}

:global(.app-control > select) {
   -webkit-appearance:none;
   padding-right: 20px;
   background-image: url("data:image/svg+xml;utf8,<svg preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23606060' width='100%' height='100%'><polyline points='50,0, 0,40 100,40'/><polyline points='50,100, 0,60 100,60'/></svg>");
   background-repeat: no-repeat;
   background-position: 95% 50%;
   background-size: 10px 60%;
}


:global(.mdatools-app .app-control-error) {
   padding: 0.5em 0.5em 0.25em 0.65em;
   font-size: 0.75em;
   color: crimson;
}


</style>