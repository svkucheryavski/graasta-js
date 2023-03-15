<script>
   import { Index, Vector } from 'mdatools/arrays';
   import { lmfit } from 'mdatools/models';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // local components
   import AppTable from './AppTable.svelte';
   import AppPlot from './AppPlot.svelte';

   // constant parameters
   const sampSize = 10;
   const popSize = 500;
   const meanX = 1.65;
   const sdX = 0.1;
   const popInd = Index.seq(1, popSize);

   // constant
   const popZ = Vector.randn(popSize);
   const popX = Vector.randn(popSize, meanX, sdX);

   // variable parameters
   let popNoise = 2;
   let sample = [];
   let selectedPoint;
   let errorType = 'full';

   function takeNewSample(popSize, sampSize) {
      sample = popInd.shuffle().slice(1, sampSize);
      selectedPoint = -1;
   }

   // population coordinates and model
   $: popY = popX.apply((x, i) => -40 + 65 * x).add(popZ.mult(popNoise));
   $: popModel = lmfit(popX, popY);

   // sample coordinates and model
   $: sampX = popX.subset(sample);
   $: sampY = popY.subset(sample);
   $: sampModel = lmfit(sampX, sampY);

   $: takeNewSample(popSize, sampSize);
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-plot-area">
         <!-- scatter plot -->
         <AppPlot bind:selectedPoint={selectedPoint} {errorType} {popModel} {sampModel} />
      </div>
      <div class="app-table-area">
         <AppTable {selectedPoint} {sampModel} />
      </div>
      <div class="app-controls-area">
         <!-- Control elements -->
         <AppControlArea>
            <AppControlSwitch
               id="errorType" label="Error"
               bind:value={errorType} options={["full", "fitting", "sampling"]}
            />
            <AppControlRange
               id="noise" label="Noise"
               bind:value={popNoise} min={0} max={5} step={0.1} decNum={0}
            />
            <AppControlButton
               on:click={() => takeNewSample(popSize, sampSize)}
               id="newSample" label="Sample" text="Take new"></AppControlButton>
         </AppControlArea>
      </div>
   </div>

   <div slot="help">
      <h2>Simple linear regression</h2>
      <p>
         The app shows how to use simple linear regression for investigation of relationship between two variables (in this case height and weight of adult female persons). The plot shows data points both for population (N = 500) and current sample (n = 10). Both sets
         of points are fitted by a simple linear regression model, you can see both models in form of lines and the corresponding equations, as well as their characteristics (standard error of  prediction and coefficient of determination, R2). The table on the right part of the app shows reference y-values, values, predicted by the model, error of prediction and its square. Sum of squared errors is what is used to compute both standard error and R2.
      </p>
      <p>
         The shaded area on the plot shows uncertainties. By default you see uncertainty from both fitting and sampling error. You can use the switcher to see uncertainty from one of the source. You can also change the amount of noise (the more noise, the less percent of y-variance can be predicted by the model) and see how it changes the uncertainties. Plus you can select any sample point on the plot and see the predicted value and the uncertainty interval for this point.
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
   grid-template-columns: 65% 35%;
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