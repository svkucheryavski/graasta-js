<script>
   import {rnorm} from 'stat-js';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';

   // local components
   import PopulationPlot from './PopulationPlot.svelte';
   import CIPlot from './CIPlot.svelte';

   // size of population and vector with element indices
   const colors = ["#909090", "#0000ff"];
   const popMean = 100;

   // variable parameters
   let popSD = 3;
   let sampSize = 5;
   let sample;

   function takeNewSample() {
      sample = rnorm(sampSize, popMean, popSD);
   }

   // take a sample if population proportion has changed
   $: popSD > 0 & sampSize > 0 ? takeNewSample() : NULL;
</script>

<StatApp>
   <div class="app-layout">

      <!-- plot for population individuals  -->
      <div class="app-population-plot-area">
         <PopulationPlot {popMean} {popSD} {sample} {colors} />
      </div>

      <!-- confidence intervals and statistic table -->
      <div class="app-ci-plot-area">
         <CIPlot {popMean} {popSD} {sample} {colors} />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlRange id="popSD" label="Sigma (σ)" bind:value={popSD} min={1} max={5} step={0.1} decNum={1} />
            <AppControlSwitch id="sampleSize" label="Sample size" bind:value={sampSize} options={[5, 10, 20, 40]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>Sample based confidence interval for mean</h2>
      <p>
         This app is similar to <code>asta-b203</code>, but in this case confidence interval for mean is computed using
         sample statistics, so we pretend we do not know the population mean and want to estimate it as a value located
         inside this interval. Thus on the right plot you see distribution
         and 95% confidence interval computed for current sample. The population mean (which in real life is unknown) is shown as a vertical line.
      </p>
      <p>
         Try to take many samples and see how often mean of the population will be inside confidence interval
         computed for the sample. If you repeat this many (hundreds) times, about 95% of the samples will have interval, which
         contains the population mean. So, before you take a new sample you have 95% chance that confidence interval,
         computed around the sample mean, will contain the population mean.
      </p>
      <p>
         In this case we use Student's t-distribution to compute the interval. For given confidence level (e.g. 95%) and
         for given sample size (e.g. 5) we define a critical t-value — how many standard errors the interval will span
         on each side of the sample mean. E.g. for n = 5 this value is 2.78. You can see this value for current sample
         size in the table with statistics. If you have R you can also compute this value using ICDF function for
         t-distribution: <code>qt(0.975, 4)</code>. Here 0.975 is the right boundary of 95% interval and 4 is a number of
         degrees of freedom, which in this case is equal to <nobr>n - 1</nobr>.
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
      "pop ciplot"
      "pop controls"
      "pop .";
   grid-template-rows: max(250px, 30%) 1fr min-content;
   grid-template-columns: 65% 35%;
}


.app-population-plot-area {
   grid-area: pop;
   box-sizing: border-box;
   height: 100%;
   width: 100%;
   padding-right: 20px;
}


.app-ci-plot-area {
   grid-area: ciplot;
}

.app-controls-area {
   padding-top: 20px;
   grid-area: controls;
}


</style>