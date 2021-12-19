<script>
   import {rnorm} from 'mdatools/stat';

   // shared components
   import {default as StatApp} from "../../shared/StatApp.svelte";
   import { colors } from "../../shared/graasta.js";

   // shared components - controls
   import AppControlArea from "../../shared/controls/AppControlArea.svelte";
   import AppControlButton from "../../shared/controls/AppControlButton.svelte";
   import AppControlSwitch from "../../shared/controls/AppControlSwitch.svelte";
   import AppControlRange from "../../shared/controls/AppControlRange.svelte";

   // local components
   import PopulationPlot from "./PopulationPlot.svelte";
   import TestResults from "./TestResults.svelte";

   // colors for population
   const colorsPop = {
      line: colors.plots.POPULATIONS[0],
      area: colors.plots.POPULATIONS_PALE[0],
      sample: colors.plots.SAMPLES[0],
      stat: colors.plots.SAMPLES[0]
   };

   // colors for H0
   const colorsH0 = {
      line: "#c0c0c0",
      area: "#c0c0c020",
      stat: "606060"
   };

   // size of population and vector with element indices
   const popH0Mean = 100;

   // variable parameters
   let popMean = 105;
   let popSD = 3;
   let sampSize = 5;
   let sample = [];
   let tail = "right";

   let sampSizeOld = sampSize;
   let popSDOld = popSD;
   let popMeanOld = popMean;
   let tailOld = tail;
   let reset = false;
   let clicked;

   // when sample size or population SD changed - reset statistics and take new sample
   $: {
      if (sample && (tailOld !== tail || sampSizeOld !== sampSize || popSDOld !== popSD || popMean !== popMeanOld)) {
         reset = true;
         sampSizeOld = sampSize;
         popSDOld = popSD;
         popMeanOld = popMean;
         tailOld = tail;
         takeNewSample()
      } else {
         reset = false;
      }
   }

   function takeNewSample() {
      sample = rnorm(sampSize, popMean, popSD);
      clicked = Math.random();
   }

   // take first sample
   takeNewSample()
</script>

<StatApp>
   <div class="app-layout">

      <!-- plot for population individuals  -->
      <div class="app-population-plot-area">
         <PopulationPlot {popMean} {popH0Mean} {popSD} {sample} {colorsPop} {colorsH0}  />
      </div>

      <!-- confidence intervals and statistic table -->
      <div class="app-test-plot-area">
         <TestResults {clicked} {reset} {popMean} {popH0Mean} {popSD} {sample} {tail} {colorsPop} />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlSwitch id="tail" label="Tail" bind:value={tail} options={["left", "right"]} />
            <AppControlRange id="popMean" label="Real mean (µ)" bind:value={popMean} min={95} max={105} step={1} decNum={0} />
            <AppControlRange id="popSD" label="Sigma (σ)" bind:value={popSD} min={2} max={4} step={0.1} decNum={1} />
            <AppControlSwitch id="sampleSize" label="Sample size" bind:value={sampSize} options={[5, 10, 20, 40]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>Power of test and Type II errors</h2>
      <p>
         This app is similar to <code>asta-b207</code> where you played with one-sample t-test. However, in this case
         you can emulate situations when H0 is not true, meaning the true population mean, µ, is different from
         what you expect by setting H0. The possibilities for H0 are the same, depending on a tail, you have the
         following options — "left": µ ≥ 100 mg/L, and "right": µ ≤ 100 mg/L. But now you can
         also change the real population mean and set it to be smaller or larger than 100 mg/L.
      </p>
      <p>
         Try to do this and check how often you will be able to reject H0 (in this case we work with significance
         level 0.05, so we reject H0 when p-value is below this value). A probability to reject wrong H0 is called a
         <strong>power of test</strong>. And the situation when you can not reject it is called <strong>Type II</strong>
         error or false negative. The probability to get Type II error is always opposite to the power of test, e.g.
         if power is 80% you have 20% chance to make a Type II error.
      </p>
      <p>
         The power of any test depends on several things. First of all it is the test itself — different methods have
         different power. Second, it depends on the <strong>size of effect</strong> — difference between H0 mean and the real
         population mean (H1). E.g. if H0 assumes that µ ≤ 100 and the real µ = 105, this difference is 5. Finally, power also
         depends on standard deviation of your population as well as on the sample size. The last has very important consequence
         — the smaller effect you want to detect, the larger sample size shpuld be.
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
      "pop testplot"
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

.app-test-plot-area {
   grid-area: testplot;
}

.app-controls-area {
   padding-top: 20px;
   grid-area: controls;
}

</style>