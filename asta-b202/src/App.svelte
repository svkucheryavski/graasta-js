<script>
   import { sum } from 'mdatools/stat';
   import { Vector, Index, c } from 'mdatools/arrays';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';
   import { colors } from "../../shared/graasta";

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';

   // local components
   import PopulationPlot from '../../shared/plots/ProportionPopulationPlot.svelte';
   import SamplePlot from '../../shared/plots/ProportionSamplePlot.svelte';
   import CIPlot from '../../shared/plots/ProportionCIPlot.svelte';

   // size of population and vector with element indices
   const popSize = 1600;
   const popIndex = Index.seq(1, popSize);
   const sampleColors = colors.plots.SAMPLES;
   const populationColors = colors.plots.POPULATIONS;
   const xLabel = 'Expected population proportion';

   // variable parameters
   let popProp = 0.50;
   let sampSize = 10;
   let sampSizeOld = sampSize;
   let popPropOld = popProp;
   let reset = false;
   let sample = [];

   // this is needed to force CI plot stats when two consequent samples are the same
   let clicked;

   function takeNewSample() {
      sample = popIndex.shuffle().subset(Index.seq(1, sampSize));
      clicked = Math.random()
   }

   // generate groups of population randomly
   let groups;
   $: {
      const n1 = Math.round(popProp * popSize);
      const n2 = popSize - n1;
      groups = c(Vector.zeros(n1), Vector.ones(n2)).shuffle();
   }

   // when sample size has changed - reset statistics
   $: {
      if (sample && (sampSizeOld !== sampSize || popPropOld !== popProp)) {
         reset = true;
         sampSizeOld = sampSize;
         popPropOld = popProp;
         takeNewSample();
      } else {
         reset = false;
      }
   }

   // proportion of current sample
   $: sampProp = 1 - sum(groups.subset(sample)) / sampSize;

   // standard error for CI
   $: sampSD = Math.sqrt((1 - sampProp) * sampProp / sampSize);

   // tale first sample
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

      <!-- confidence intervals and statistic table -->
      <div class="app-ci-plot-area">
         <CIPlot {clicked} ciCenter={sampProp} ciSD={sampSD} ciStat={popProp} {reset} {xLabel} />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlRange id="popProp" label="Proportion" bind:value={popProp} min={0.1} max={0.9} step={0.05} decNum={2} />
            <AppControlSwitch id="sampleSize" label="Sample size" bind:value={sampSize} options={[10, 20, 40]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>Sample based confidence interval for proportion</h2>
      <p>
         This app is similar to <code>asta-b201</code>, but, in this case, confidence interval is computed
         based on sample proportion. This requires larger sample size, so for every category you need at
         least 10 individuals in your sample. For example, if proportion is 20%, you need sample size of at
         least n = 50 to make a reliable interval (20% of 50 is 10). For p = 10% the sample size should
         be n = 100.
      </p>
      <p>
         The app shows 95% confidence interval computed for current sample as a plot on the right side. So,
         every time you take a new sample, this also results in a new confidence interval. The vertical red line
         on this plot shows the population proportion, which in real life we do not know. If you take a new
         sample many times (say, 200-300) you can see how often the population proportion, π, was inside the
         interval. If sample size is large enough it should be close to 95% — the confidence level.
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
      "pop ciplot"
      "pop controls"
      "pop .";
   grid-template-rows: 130px max(30%, 195px) auto min-content;
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
   min-height: 130px;
}


.app-ci-plot-area {
   grid-area: ciplot;
}

.app-ci-plot-area :global(.plot) {
   min-height: 195px;
}

.app-controls-area {
   padding-top: 10px;
   grid-area: controls;
}

</style>