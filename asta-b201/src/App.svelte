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

   // shared components - plots
   import PopulationPlot from '../../shared/plots/ProportionPopulationPlot.svelte';
   import SamplePlot from '../../shared/plots/ProportionSamplePlot.svelte';
   import CIPlot from '../../shared/plots/ProportionCIPlot.svelte';

   // size of population and vector with element indices
   const popSize = 1600;
   const popIndex = Index.seq(1, popSize);
   const sampleColors = colors.plots.SAMPLES;
   const populationColors = colors.plots.POPULATIONS;
   const labelStr = '# samples inside CI';
   const xLabel = 'Expected sample proportion';

   // variable parameters$
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
      clicked = Math.random();
   }

   // generate groups of population randomly
   let groups;
   $: {
      const n1 = Math.round(popProp * popSize);
      const n2 = popSize - n1;
      groups = c(Vector.zeros(n1), Vector.ones(n2)).shuffle();
   }

   // when sample size or population proportion changed - reset statistics and take new sample
   $: {
      if (sample && (sampSizeOld !== sampSize || popPropOld !== popProp)) {
         reset = true;
         sampSizeOld = sampSize;
         popPropOld = popProp;
         takeNewSample()
      } else {
         reset = false;
      }
   }

   // proportion of current sample
   $: sampProp = 1 - sum(groups.subset(sample)) / sampSize;
   $: popSD = Math.sqrt((1 - popProp) * popProp / sampSize);

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

      <!-- confidence intervals and statistic table -->
      <div class="app-ci-plot-area">
         <CIPlot {clicked} ciCenter={popProp} ciSD={popSD} ciStat={sampProp} reset={reset} {labelStr} {xLabel} />
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
      <h2>Population based confidence interval for proportion</h2>
      <p>
         This app allows you to play with proportion of a random sample. Here we have a population with N = 1600
         individuals. Some of them are red, some are blue. You can change the proportion of the red
         individuals as you want (by default it is 50%). The population is shown as large plot on the left.
      </p>
      <p>
         If we know proportion of population and sample size we can compute an interval of expected proportions
         of the future samples. So, when you take a new random sample of that size from the population, its proportion
         will likely to be inside the interval. This interval is called <em>confidence interval for proportion</em>
         and since we compute it based on proportion parameter, it is <em>population based</em>.
      </p>
      <p>
         The interval for selected population proportion and current sample size computed for 95% confidence level is
         shown as a red area under a distribution curve on the right. The vertical line on that plot is a proportion of
         your current sample. Try to take many samples and see how often the proportion of the sample will be inside
         the interval (text on the plot shows this information). If you repeat this many (hundreds) times, about
         95% of the samples should have proportion within the interval. <strong>However this works only if number of
         individuals in each group is at least 5.</strong> So if proportion is 10% you need to have sample size n = 50 to meat
         this requirement.
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

   grid-template-rows: 130px max(35%, 185px) auto min-content;
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
   min-height: 185px;
}


.app-controls-area {
   padding-top: 20px;
   grid-area: controls;
}

</style>