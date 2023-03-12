<script>
   import { Vector, Index, c } from 'mdatools/arrays';

   // shared components
   import { default as StatApp } from '../../shared/StatApp.svelte';
   import { colors } from '../../shared/graasta';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';

   // shared components - from app asta-b201
   import PopulationPlot from '../../shared/plots/ProportionPopulationPlot.svelte';
   import SamplePlot from '../../shared/plots/ProportionSamplePlot.svelte';

   // local components
   import TestResults from './TestResults.svelte';

   // size of population and vector with element indices
   const popSize = 1600;
   const popIndex = Index.seq(1, popSize);
   const sampleColors = colors.plots.SAMPLES;
   const populationColors = colors.plots.POPULATIONS;

   // variable parameters
   let popProp = 0.50;
   let sampSize = 20;
   let tail = 'left';
   let sample = [];

   let oldTail = tail;
   let oldPopProp = -1;
   let oldSampSize = -1;
   let reset = false;

   // clicked is needed if two samples in a row have the same proportion
   // using clicked will force test plot to calculate a new p-value anyway
   // and count new sample in accumulated statistics
   let clicked;

   $: {
      if (sample && (oldTail !== tail || oldPopProp !== popProp || oldSampSize !== sampSize)) {
         reset = true;
         oldTail = tail;
         oldPopProp = popProp;
         oldSampSize = sampSize;
         takeNewSample();
      } else {
         reset = false;
      }
   }


   // function to take a new sample from population ising a shuffle function
   function takeNewSample() {
      sample = popIndex.shuffle().subset(Index.seq(1, sampSize));
      clicked = Math.random();
   }

   // generate red and blue points for population and shuffle them
   let groups;
   $: {
      const n1 = Math.round(popProp * popSize);
      const n2 = popSize - n1;
      groups = c(Vector.zeros(n1), Vector.ones(n2)).shuffle();
   }

   // take first sample
   takeNewSample();
</script>

<StatApp>
   <div class="app-layout">

      <!-- plot for population individuals  -->
      <div class="app-population-plot-area">
         <PopulationPlot {groups} {sample} {populationColors} {sampleColors}/>
      </div>

      <!-- plot for sample individuals -->
      <div class="app-sample-plot-area">
         <SamplePlot {groups} {sample} colors={sampleColors} />
      </div>

      <!-- sampling distribution plot with statistics -->
      <div class="app-test-plot-area">
         <TestResults {reset} {clicked} {groups} {sample} {tail} />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlRange id="popProp" label="Proportion" bind:value={popProp} min={0.05} max={0.95} step={0.05} decNum={2} />
            <AppControlSwitch id="tail" label="Tail" bind:value={tail} options={["left", "both", "right"]} />
            <AppControlSwitch id="sampleSize" label="Sample size" bind:value={sampSize} options={[20, 30, 40]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>Test for sample proportion</h2>
      <p>
         This app visualizes a test for proportion of a sample — how likely the current sample came from population with given H0. In this case H0 is true, our population indeed has a proportion, π, which we set manually in the app (the population is shown on the left plot). So we expect that the test will confirm the H0 most of the time.
      </p>
      <p>
         Every time you take a new sample, app computes standard error and makes sampling distribution of possible
         proportions around π using the computed standard error and normal distribution. After that it evaluates how extreme your sample is and results in a p-value — chance to get a sample with proportion like you have or even more extreme assuming that H0 is true. If you take many samples, e.g. 200 or 300, then only 5% will have a p-value below 0.05, you can see all statistics right on the plot.
      </p>
      <p>
         However, this will work only if sample size is large enough. Try to set the population proportion to π = 0.05 or 0.95. You will see that in this case even sample with n = 40 is too small for the test — sampling distribution curve will be truncated on one side. This leads to two problems — you will see an extreme p-value more often than expected and you have a chance to get a sample with members only from one group, so the sample proportion will be either 0 or 1. In this case standard error is 0 and there is no possibility to make a test. You need much larger sample to make a reliable test for such cases.
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
      "pop sampplot"
      "pop testplot"
      "pop controls"
      "pop .";

   grid-template-rows: 120px max(30%, 180px) auto min-content;
   grid-template-columns: 65% 35%;
}

.app-population-plot-area {
   grid-area: pop;
   box-sizing: border-box;
   height: 100%;
   width: 100%;
   padding-right: 20px;
}

.app-sample-plot-area {
   grid-area: sampplot;
}

.app-sample-plot-area :global(.plot) {
   min-height: 120px;
}

.app-test-plot-area {
   grid-area: testplot;
}

.app-test-plot-area :global(.plot) {
   min-height: 180px;
}

.app-controls-area {
   padding-top: 5px;
   grid-area: controls;
}

</style>