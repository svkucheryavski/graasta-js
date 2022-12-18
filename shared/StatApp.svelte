<script>
   let showHelp = false;

   const toggleHelp = () => showHelp = !showHelp;

   const handleKeyPress = e => {
      if (e.key === 'h') toggleHelp();
   };

   // $: showHelp = window.location.hash === "#help";
</script>

<svelte:window on:keypress={handleKeyPress}/>
<main class="graasta-app">

   <div class="content">
      <slot></slot>
   </div>

   {#if showHelp}
   <div class="helptext">
      <slot name="help"></slot>
   </div>
   {/if}

</main>

<style>

/* main styles for graasta-app and children */
:global(#graasta-app-container) {
   height: max-content;
   width: 100% !important;
}

.graasta-app {
   font-family: Helvetica, Areal, Verdana, sans-serif;
   display: block;
   position: relative;
   font-size: max(14px, 1vw);

   aspect-ratio: 16/9;
   min-width: 800px;

   width: 100%;
   height: auto;

   box-sizing: border-box;
   padding: 0;
   margin: 0 auto;
   background: #fdfdfd;
}

.graasta-app  * {
   box-sizing: border-box;
   margin: 0;
   padding: 0;
}

.graasta-app :glbal(.plot) {
   box-shadow: 0px 0px 5px  #30303020;
}

.graasta-app .content {
   width: 100%;
   height: 100%;
}

/* help text and button */

.helptext {
   font-family: 'Open Sans', sans-serif;

   position: absolute;
   top: 0;
   width: 0;
   left: 0;
   bottom: 0;

   z-index: 999;
   background: white;
   box-sizing: border-box;

   width: 100%;
   height: 100%;
   padding: 1em;
   margin: 0;
   line-height: 1.35em;
   font-size: 1em;
   color: #303030;
}

.helptext :global(h2) {
   padding: 1.25em 0 0.5em 0;
   font-size: 1.2em;
}

.helptext :global(p) {
   padding: 0 0 0.5em 0;
   line-height: 1.5em;
   font-size: 1em;
}

</style>