<script>
   import { Vector } from 'mdatools/arrays';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // local components
   import TestColumnPlot from './TestColumnPlot.svelte';
   import TestColumnTable from './TestColumnTable.svelte';
   import TestColumn from './TestColumn.svelte';

   // constant parameters
   const globalMean = 100;
   const sampSize = 5;
   const labels = ['A', 'B', 'C'];

   // parameters, which can vary
   let correction = 'off';
   let noiseExpected = 10;
   let alpha = 0.05
   let samples;
   let p = [];

   function takeNewSample(reset = false) {
      if (reset) p = [];
      samples = [
         Vector.randn(sampSize, globalMean, noiseExpected),
         Vector.randn(sampSize, globalMean, noiseExpected),
         Vector.randn(sampSize, globalMean, noiseExpected),
      ];
   }

   // take a new sample when population parameters have been changed
   $: noiseExpected || correction ? takeNewSample(true)  : null;
   $: alpha = correction === 'on' ? 0.05/3 : 0.05;
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-original-data-area">

         <!-- original values table  -->
         <TestColumnTable labels={labels} samples={samples} />

         <!-- boxplot for samples and populations -->
         <TestColumnPlot
            {samples}
            popMeans={[globalMean, globalMean, globalMean]}
            alpha={alpha}
            popSigma={noiseExpected}
            pValues={p}
            boxColor="#f0f0f0"
            color="#a0a0a0"
         />

         <!-- Control elements -->
         <AppControlArea>
            <AppControlRange id="noise" label="Noise (σ)" bind:value={noiseExpected} min={5} max={15} step={1} decNum={0}/>
            <AppControlSwitch id="correction" label="Correction" bind:value={correction} options={["on", "off"]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

      <div class="app-test-data-area">
         <TestColumn labels={['A', 'B']} {alpha} bind:p={p[0]} samples={[samples[0], samples[2]]} />
      </div>

      <div class="app-test-data-area">
         <TestColumn labels={['A', 'C']} {alpha} bind:p={p[1]} samples={[samples[0], samples[2]]} />
      </div>

      <div class="app-test-data-area">
         <TestColumn labels={['B', 'C']} {alpha} bind:p={p[2]} samples={[samples[1], samples[2]]} />
      </div>
   </div>

   <div slot="help">
      <h2>Multiple t-test and Bonferroni correction</h2>
      <p>
         This app shows how to compare three samples taken from three populations. The three populations
         are all outcomes (yield measured in mg/L) of a chemical process
         running with a catalyst A, catalyst B and catalyst C. Here H0: µA = µB = µC = 100 mg/L. This means that
         regardless which catalyst we use, the average yield of the reaction is 100 mg/L, so changing
         catalyst has no effect on the yield. But when we run the reaction only 5 times for each catalyst, like shown
         in the app, the mean of these 5 runs will not be the same as the expected mean of the populations.
         And most of the time you will observe a difference among the sample means. Our goal is to use a t-test to
         test the H0 and make decision.
      </p>
      <p>
         However, t-test can be applied for comparing mean of two samples, while here we have three. One of the
         possibility will be to run t-test three times — one for each pair. This is what is called a <em>multiple
         compare</em> — you compare samples using several tests to check a single hypothesis. But the more tests
         you do the higher chance that you will reject correct H0. Try to
         run the test many times and you will see that although app works at significance limit 0.05 (so we expect
         that the H0 will be incorrectly rejected in 5% of cases), the real percent of rejections will be higher,
         about 10%.
      </p>
      <p>
         You can overcome this problem by using Bonferroni correction, which decreases the significance
         limit in each individual tests, so the overall significance will be 0.05 (or any other pre-defined value).
         You can see the effect of correction by turning it on in the app and repeating the sampling many times again.
         In this case the significance level for individual tests will be set to 0.05/3 ≈ 0.017 and the number of
         incorrectly rejected H0 will be around 5%.
      </p>
   </div>
</StatApp>

<style>

.app-layout {
   width: 100%;
   height: 100%;
   position: relative;

   display: flex;
   flex-direction: row;
}

.app-layout > div {
   margin: 0 ;
}

/* main column */
.app-original-data-area{
   flex: 0 1 30%;

   display: grid;
   grid-template-areas:
      "table sign"
      "plot plot"
      "controls controls"
      ". .";
   grid-template-rows: min-content 1fr min-content auto;
   grid-template-columns: 1fr min-content;
}


.app-original-data-area  > :global(.plot) {
   grid-area: plot;
}

.app-original-data-area  > :global(.app-control-block) {
   margin-top: 1em;
   grid-area: controls;
}


/* column with unbiased data */
.app-test-data-area{
   flex: 0 1 23%;
   box-sizing: border-box;
   padding-left: 10px;
}

</style>