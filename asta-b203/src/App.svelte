<script>
   import { Vector } from 'mdatools/arrays';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';
   import { colors } from '../../shared/graasta.js';

   // shared components - controls
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';

   // shared components - plots
   import PopulationPlot from '../../shared/plots/MeanPopulationPlot.svelte';

   // local components
   import CIPlot from './MeanCIPlot.svelte';

   // size of population and vector with element indices
   const popColor = colors.plots.POPULATIONS[0];
   const popAreaColor = colors.plots.POPULATIONS_PALE[0];
   const sampColor = colors.plots.SAMPLES[0]
   const popMean = 100;

   // variable parameters
   let popSD = 3;
   let sampSize = 5;
   let sample = [];
   let sampSizeOld;
   let popSDOld;
   let reset = false;
   let clicked;

   // when sample size or population SD changed - reset statistics and take new sample
   $: {
      if (sample && (sampSizeOld !== sampSize || popSDOld !== popSD)) {
         reset = true;
         sampSizeOld = sampSize;
         popSDOld = popSD;
         takeNewSample()
      } else {
         reset = false;
      }
   }

   function takeNewSample() {
      sample = Vector.randn(sampSize, popMean, popSD);
      clicked = Math.random();
   }

   // take first sample
   takeNewSample()
</script>

<StatApp>
   <div class="app-layout">

      <!-- plot for population individuals  -->
      <div class="app-population-plot-area">
         <PopulationPlot {popMean} {popSD} {sample} {popAreaColor} {popColor} {sampColor}/>
      </div>

      <!-- confidence intervals and statistic table -->
      <div class="app-ci-plot-area">
         <CIPlot {popMean} {popSD} {sample} {reset} {clicked} />
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
      <h2>Population based confidence interval for mean</h2>
      <p>
         This app is similar to <code>asta-b201</code> but is made to give you an idea about uncertainty of sample mean.
         Here we have a normally distributed population — concentration of Chloride in different parts of a water source.
         The concentration has a fixed mean, <em>µ</em> = 100 mg/L, and a standard deviation, <em>σ</em>, which you can
         vary from 1 to 5 mg/L. The population distribution is shown using gray colors on the left plot. Blue points on
         that plot show values of a current sample, randomly taken from the population. The vertical lines show the
         corresponding means.
      </p>
      <p>
         If we know mean of population, <em>µ</em>, and sample size, we can compute an interval of expected mean values
         of the future samples, <em>m</em>. So, when you take a new random sample of that size from the population, its
         mean value will likely to be inside the interval. This interval is called <em>confidence interval for mean</em>
         and since we compute it based on population parameter, it is <em>population based</em>.
      </p>
      <p>
         Right plot shows distribution of possible mean values of samples to be randomly taken from the current population
         (and for current sample size). Confidence interval, computed for 95% confidence level is shown as a gray area
         under the distribution curve. The blue vertical line on that plot is a mean of
         your current sample. Try to take many samples and see how often the mean of a sample will be inside
         the interval (table under the plot shows this information). If you repeat this many (hundreds) times, about
         95% of the samples should have mean within the interval.
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