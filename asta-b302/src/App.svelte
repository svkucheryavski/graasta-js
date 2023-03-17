<script>
   import { Index, Vector } from 'mdatools/arrays';
   import { mean } from 'mdatools/stat';

   import { getIndices } from '../../shared/graasta.js';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';
   import AppControlSelect from '../../shared/controls/AppControlSelect.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // shared components - plots
   import CovariancePlot from '../../shared/plots/CovariancePlot.svelte';

   // local components
   import AppStat from './AppStat.svelte';

   // constant parameters
   const popSize = 500;
   const meanX = 100;
   const sdX = 10;
   const popInd = Index.seq(1, popSize);

   // random values which do not change inside the app
   const popZ = Vector.randn(popSize);
   const popX = Vector.randn(popSize, meanX, sdX);

   // variable parameters
   let sampSize = 10;
   let popNoise = 10;
   let popSlope = 1;
   let sample = [];
   let plotType = "z'";

   let reset = false;
   let clicked;

   let oldNoise = popNoise;
   let oldSlope = popSlope;
   let oldSampSize = sampSize;

   $: {
      if (sample && (oldSampSize !== sampSize || oldNoise !== popNoise || oldSlope !== popSlope)) {
         reset = true;
         oldSampSize = sampSize;
         oldNoise = popNoise;
         oldSlope = popSlope;
         takeNewSample();
      } else {
         reset = false;
      }
   }

   function takeNewSample() {
      sample = popInd.shuffle().slice(1, sampSize);
      clicked = Math.random();
   }

   $: popY = popX.apply((x, i) => (x - meanX) * popSlope + meanX).add(popZ.mult(popNoise));

   $: sampX = popX.subset(sample);
   $: sampY = popY.subset(sample);
   $: sampMeanX = mean(sampX);
   $: sampMeanY = mean(sampY);
   $: [indPos, indNeg, indNeu] = getIndices(sampX, sampMeanX, sampY, sampMeanY);

   // take first sample
   takeNewSample();
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-plot-area">
         <!-- scatter plot -->
         <CovariancePlot limY={[10, 200]} {popX} {sampX} {popY} {sampY} {indNeg} {indPos} {indNeu} />
      </div>
      <div class="app-stat-area">
         <AppStat {clicked} {reset} {popX} {popY} {sampX} {sampY} {plotType} />
      </div>
      <div class="app-controls-area">
         <!-- Control elements -->
         <AppControlArea>
            <AppControlSwitch
               id="plotType" label="CI"
               bind:value={plotType} options={["r", "z'"]}
            />
            <AppControlRange
               id="slope" label="Slope"
               bind:value={popSlope} min={-2.5} max={2.5} step={0.1} decNum={1}
            />
            <AppControlRange
               id="noise" label="Noise"
               bind:value={popNoise} min={1} max={30} step={1} decNum={0}
            />
            <AppControlSelect
               id="sampSize" label="Sample size"
               bind:value={sampSize} options={[10, 20, 30]}
            />
            <AppControlButton
               on:click={() => takeNewSample(popSize, sampSize)}
               id="newSample" label="Sample" text="Take new"></AppControlButton>
         </AppControlArea>
      </div>
   </div>

   <div slot="help">
      <h2>Correlation and population based confidence interval</h2>
      <p>
         This app helps you to understand the Pearson's correlation coefficient, <em>r(x,y)</em>, which is computed as covariance for standardized <em>x</em> and <em>y</em> values. Alternatively you can compute covariance for the original values
         and then standardize the covariance by dividing it to the standard deviation of  <em>x</em> and <em>y</em>.
         If there is no noise at all, and <em>y</em> is linearly dependent on <em>x</em>, the correlation does not depend on
         slope of the line. However, when noise is present, the slope has an influence which you can see by playing with the
         app. The right column in the table with statistics (shown as gray) shows values for population, the middle column shows values for a current sample.
      </p>
      <p>
         The uncertainty for correlation coefficient of a sample depends both on the correlation of population and
         the sample size. The sample correlation coefficient does not follow any theoretical distribution, therefore
         for computing the uncertainty and corresponding confidence interval, a <a href="https://en.wikipedia.org/wiki/Fisher_transformation">transformed statistic</a>, <em>z'</em>, is used. This
         statistic follows normal distribution if n &gt; 10. The app shows how the distribution of <em>z'</em> looks like
         for different levels of noise and how it can be transformed back to distribution of <em>r</em> values.
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
      "plot stat"
      "plot controls"
      "plot .";

   grid-template-rows: max(250px, 60%) min-content auto;
   grid-template-columns: auto min(400px, 35%);
}

.app-plot-area {
   grid-area: plot;
}

.app-stat-area {
   grid-area: stat;
   display: flex;
   flex-direction: column;
}

.app-controls-area {
   padding-top: 1em;
   padding-left: 1em;
   grid-area: controls;
}

</style>