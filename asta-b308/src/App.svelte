<script>

   // shared components
   import {default as StatApp} from "../../shared/StatApp.svelte";

   // shared components - controls
   import AppControlArea from "../../shared/controls/AppControlArea.svelte";
   import AppControlButton from "../../shared/controls/AppControlButton.svelte";
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // local components
   //import AppCoeffsPlot from "./AppCoeffsPlot.svelte";
   import AppPlot from "./AppPlot.svelte";

   let b1 = 0;
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-plot-area">
         <!-- scatter plot -->
         <AppPlot />
      </div>

      <div class="app-table-area">
      </div>

      <div class="app-controls-area">
         <!-- Control elements -->
         <AppControlArea>
            <AppControlRange
               id="b1" label="b1"
               bind:value={b1} min={0} max={1}
            />
         </AppControlArea>
      </div>
   </div>

   <div slot="help">
      <h2>Multiple linear regression model</h2>
      <p>
      </p>
   </div>
</StatApp>

<style>

.app-layout {
   width: 100%;
   height: 100%;
   position: relative;

   display: grid;
   grid-template-areas:
      "plot table"
      "plot controls";

   grid-template-rows: 1fr auto;
   grid-template-columns: 65% minmax(350px, 35%);
}

.app-plot-area {
   grid-area: plot;
}

.app-table-area {
   grid-area: table;
}

.app-controls-area {
   padding-left: 1em;
   grid-area: controls;
}

</style>