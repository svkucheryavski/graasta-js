<script>
   import { Index, Vector } from 'mdatools/arrays';
   import { polyfit } from 'mdatools/models';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // local components
   import AppCoeffsPlot from './AppCoeffsPlot.svelte';
   import AppPlot from "./AppPlot.svelte";

   // constant parameters
   const popSize = 500;
   const meanX = 0;
   const sdX = 1;
   const popInd = Index.seq(1, popSize);

   // constant
   const popZ = Vector.randn(popSize);
   const popX = Vector.randn(popSize, meanX, sdX);

   // variable parameters
   let popNoise = 10;
   let sampSize = 10;
   let pType = 'line'
   let sample = [];
   let reset = false;

   function takeNewSample(sampSize) {
      sample = popInd.shuffle().slice(1, sampSize);
   }

   // variables to trigger reset event
   let oldSampSize = sampSize;
   let oldPType = pType;
   $: if (sample && (oldSampSize !== sampSize || oldPType !== pType)) {
         reset = true;
         oldSampSize = sampSize;
         oldPType = pType;
         takeNewSample(sampSize);
      } else {
         reset = false;
      }

   // set polynomial degree
   $: pDegree = {'line': 1, 'quadratic': 2, 'cubic': 3}[pType];

   // compute population coordinates and model
   $: popY = popX.apply((x, i) => -40 + 65 * x).add(popZ.mult(popNoise));
   $: popModel = polyfit(popX, popY, pDegree);

   // compute sample coordinates and model
   $: sampX = popX.subset(sample);
   $: sampY = popY.subset(sample);
   $: sampModel = polyfit(sampX, sampY, pDegree);

   // take the first sample
   takeNewSample(sampSize);
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-plot-area">
         <!-- scatter plot -->
         <AppPlot {popModel} {sampModel} {reset} />
      </div>
      <div class="app-coeffsplot-area">
         <AppCoeffsPlot {popModel} {sampModel} {reset} />
      </div>
      <div class="app-controls-area">
         <!-- Control elements -->
         <AppControlArea>
            <AppControlSwitch
               id="pDegree" label="Polynomial"
               bind:value={pType} options={["line", "quadratic", "cubic"]}
            />
            <AppControlSwitch
               id="sampSize" label="Sample size"
               bind:value={sampSize} options={[5, 10, 30, 100]}
            />
            <AppControlButton
               on:click={() => takeNewSample(sampSize)}
               id="newSample" label="Sample" text="Take new"></AppControlButton>
         </AppControlArea>
      </div>
   </div>

   <div slot="help">
      <h2>Sampling error and overfitting</h2>
      <p>
         This app shows how sample size and complexity of a regression model influence the sampling error. Sampling
         error in this case can be defined as variation of regression coefficients of a model, trained on
         a sample, around the "true" regression coefficients of a model trained on the population points.
         This app uses polynomial model for regression — the higher polynomial degree the higher
         the model complexity.
      </p>
      <p>
         Just set the desired sample size and the polynomial degree and then start collecting new samples.
         Points and model for the current sample are shown using red color for better contrast.
         The models for all previous samples are kept on the main plot (they are also red but semi transparent),
         so you can see how big the variation of the models is.
      </p>
      <p>The small plot on the right shows regression coefficients. The semi-transparent blue
         bars show the "true" regression coefficients for the population. Red points are regression
         coefficients of current and all previous samples. So you can see how big the variation of
         the coefficients is and how it depends on sample size and model complexity.
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
      "plot coeffsplot"
      "plot controls";

   grid-template-rows: 1fr auto;
   grid-template-columns: 65% 35%;
}

.app-plot-area {
   grid-area: plot;
}

.app-coeffsplot-area {
   grid-area: coeffsplot;
   padding: 1em 0;
}

.app-controls-area {
   padding-left: 1em;
   grid-area: controls;
}

</style>