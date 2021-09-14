<script>
   import {max} from 'stat-js';
   import {Axes, XAxis, YAxis, Box, LineSeries, ScatterSeries} from 'svelte-plots-basic';
   import {BoxAndWhiskers, Histogram} from 'svelte-plots-stat';
   import {default as StatApp} from '../../shared/StatApp.svelte';

   let sampleSize = 6;
   let variableName = "Height";

</script>

<StatApp>
   <div class="app-layout">

      <!-- plot  -->
      <div class="app-histogram-area">
      </div>

      <!-- plot -->
      <div class="app-percentile-area">
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <fieldset>
         <div class="app-control">
            <label for="variableName">Select property:</label>
            <select name="variableName" bind:value="{variableName}">
            </select>
         </div>
         </fieldset>
      </div>

   </div>

   <div slot="help">
      <h2>Title</h2>
      <p>Some help text
      </p>

   </div>
</StatApp>

<style>

.app-layout {
   grid-template-columns: 3fr 2fr;
   grid-template-rows: 3fr 1fr;
   grid-template-areas:
      "plot1 plot2"
      "plot1 controls";
}

.app-histogram-area {
   grid-area: plot1;
   box-sizing: border-box;
   height: 100%;
   width: 100%;
}

.app-percentile-area {
   grid-area: plot2;
   box-sizing: border-box;
   height: 100%;
   width: 100%;
}

.app-controls-area {
   grid-area: controls;
}

</style>