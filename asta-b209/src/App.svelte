<script>
   import { ttest2 } from 'mdatools/tests';
   import { Vector } from 'mdatools/arrays';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';

   // shared components - controls
   import TTestPlot from '../../shared/plots/TTestPlot.svelte';
   import CIPlotSimple from '../../shared/plots/CIPlotSimple.svelte';

   // local components
   import PopulationPlot from './PopulationPlot.svelte';

   const globalMean = 100;
   let effectExpected = 0;
   let noiseExpected = 10;
   let sampSize = 3;
   let samples = [];

   let sampSizeOld = sampSize;
   let expEffectOld = effectExpected;
   let expNoiseOld = noiseExpected;
   let reset = false;
   let clicked;

   const xLabelTest = 'Expected values for m1 – m2';
   const xLabelCI = 'Expected values for µ1 – µ2';
   const limX = [-70, 70];

   // when sample size or population SD changed - reset statistics and take new sample
   $: {
      if (samples && (sampSizeOld !== sampSize || expEffectOld !== effectExpected ||expNoiseOld !== noiseExpected)) {
         reset = true;
         sampSizeOld = sampSize;
         expEffectOld = effectExpected;
         expNoiseOld = noiseExpected;
         takeNewSample()
      } else {
         reset = false;
      }
   }

   // make a test
   $: testRes = ttest2(samples[0], samples[1], 0.05, "both");

   function takeNewSample() {
      samples = [
         Vector.randn(sampSize, globalMean - effectExpected/2, noiseExpected),
         Vector.randn(sampSize, globalMean + effectExpected/2, noiseExpected)
      ];

      clicked = Math.random();
   }

   // take first sample
   takeNewSample()
</script>

<StatApp>
   <div class="app-layout">

      <!-- plot for population individuals  -->
      <div class="app-popplot-area">
         <PopulationPlot {globalMean} {samples} {noiseExpected} {effectExpected} />
      </div>

      <!-- test plot -->
      <div class="app-testplot-area">
         <TTestPlot {testRes} {reset} {clicked} xLabel={xLabelTest} {limX} />
      </div>

      <!-- confidence interval plot -->
      <div class="app-ciplot-area">
         <CIPlotSimple effectObserved={testRes.effectObserved} effectExpected={testRes.effectExpected} ci={testRes.ci}
            se={testRes.se} {limX} xLabel={xLabelCI} />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlRange id="effect" label="Effect" bind:value={effectExpected} min={-10} max={10} step={1}
               decNum={0} />
            <AppControlRange id="noise" label="Noise (σ)" bind:value={noiseExpected} min={5} max={20} step={1} decNum={0} />
            <AppControlSwitch id="sampSize" label="Sample size" bind:value={sampSize} options={[3, 5, 10, 30]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>Two sample t-test</h2>
      <p>
         This app shows how to compare means of two samples. In this case the objective is to find out if
         the samples were taken from populations with the same means (H0: µ1 = µ2) or not (H1: µ1 ≠ µ2).
         Here we use this test to see if increasing a temperature influence the yield of a chemical reaction.
         So, the population 1 consists of all possible outcomes of the reaction running at T = 120ºC. The population 2
         consists of all possible outcomes of the reaction running at T = 160ºC. We assume that there are no other
         systematic factors involved so the variation of yield within each population is totally random and is distributed
         normally. The left plot shows the corresponding distributions using blue and red colors.
      </p>
      <p>
         By default µ1 = µ2 = 100 mg. Since µ1 – µ2 = 0, we can say that in
         this case <em>temperature does not have any effect on yield</em>.
         However, if we run the reactions just a few times (e.g. 3 for each temperature) you will always
         observe an effect and therefore you need to asses how likely you observe it just by chance.
      </p>
      <p>
         Use the app and investigate how often you will see an effect, which is not present and, vice versa,
         how often you will not be able to detect an existent effect. Check how the real (expected) effect size, noise and sample
         size influence this ability. The app works using significance level 0.05 but
         remember that for real applications it is better to use smaller value for the level.
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
      "popplot ciplot"
      "popplot testplot"
      "popplot controls"
      "popplot .";
   grid-template-rows: max(150px, 30%) max(190px, 35%) 1fr min-content;
   grid-template-columns: 65% 35%;
}


.app-popplot-area {
   grid-area: popplot;
   display: block;
   box-sizing: border-box;
   height: 100%;
   width: 100%;
   padding-right: 20px;
}

.app-testplot-area {
   box-sizing: border-box;
   grid-area: testplot;
   padding-bottom: 10px;
}

.app-ciplot-area {
   grid-area: ciplot;
   padding-bottom: 10px;
}

.app-controls-area {
   grid-area: controls;
}

</style>