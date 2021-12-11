<script>
   import {rnorm} from "stat-js";

   // shared components
   import {default as StatApp} from "../../shared/StatApp.svelte";
   import { colors } from "../../shared/graasta.js";

   // shared components - controls
   import AppControlArea from "../../shared/controls/AppControlArea.svelte";
   import AppControlButton from "../../shared/controls/AppControlButton.svelte";
   import AppControlSwitch from "../../shared/controls/AppControlSwitch.svelte";
   import AppControlRange from "../../shared/controls/AppControlRange.svelte";

   // local components
   import PopulationPlot from "../../shared/plots/MeanPopulationPlot.svelte";
   import TestResults from "./TestResults.svelte";

   const popColor = colors.plots.POPULATIONS[0];
   const popAreaColor = colors.plots.POPULATIONS_PALE[0];
   const sampColor = colors.plots.SAMPLES[0]
   const popMean = 100;

   // variable parameters
   let popSD = 3;
   let sampSize = 5;
   let tail = "left";
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
         <PopulationPlot {popMean} {popSD} {sample} {popAreaColor} {popColor} {sampColor}/>
      </div>

      <!-- confidence intervals and statistic table -->
      <div class="app-ci-plot-area">
         <TestResults {clicked} {reset} {popMean}  {popSD} {sample} {tail} />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlSwitch id="tail" label="Tail" bind:value={tail} options={["left", "both", "right"]} />
            <AppControlRange id="popSD" label="Sigma (σ)" bind:value={popSD} min={1} max={5} step={0.1} decNum={1} />
            <AppControlSwitch id="sampleSize" label="Sample size" bind:value={sampSize} options={[5, 10, 20, 40]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>One-sample t-test</h2>
      <p>
         This app helps to understand how does the one sample t-test work. Here we have a normally distributed
         population — concentration of Chloride in different parts of a water source. The null hypothesis in this case
         is made about the population mean, µ, and, depending on a tail, you have the following options — "both": H0: µ = 100 mg/L,
         "left": µ ≥ 100 mg/L, and "right": µ ≤ 100 mg/L.
         The population in this app has µ exactly equal to 100 mg/L, so all three hypothesis are true in this case.
         You have a possibility to change the standard deviation of the population, which by default is set to 3 mg/L
         but you will see, that it does not influence the outcome of the test.
      </p>
      <p>
         Then you can take a random sample from this population and see how far the mean of the sample
         is from the mean of the population. The app computes a chance to get a sample as extreme as given or even
         more extreme assuming that H0 is correct — the <strong>p-value</strong>. Usually p-value is used to assess how
         extreme your particlar sample is for being taken from population where H0 is true. If p-value is small,
         it is considered as unlikely event and H0 is rejected.
      </p>
      <p>
         Often researchers use 5% (0.05) as a threshold for that. It is called <em>significance limit</em>. You will see
         that if you take many samples (100 or more), you will find out that approximately 5% of the samples will have
         p-value below 0.05 although the H0 is true. And this happens regardless the sample size. So this threshold is
         simply a chance to make a wrong decision by rejection the correct H0. So, if you use 0.05 you have 5% chance to
         make a wrong decision and e.g. "see" an effect, which does not exist.
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