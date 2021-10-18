<script>
   import {seq, subset, rep, shuffle} from 'stat-js';

   // children blocks
   import PopulationPlot from './PopulationPlot.svelte';
   import SamplePlot from './SamplePlot.svelte';
   import CIPlot from './CIPlot.svelte';

   // common blocks
   import {default as StatApp} from '../../shared/StatApp.svelte';
   import AppControlArea from '../../shared/AppControlArea.svelte';
   import AppControlButton from '../../shared/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/AppControlSwitch.svelte';
   import AppControlRange from '../../shared/AppControlRange.svelte';

   // size of population and vector with element indices
   const popSize = 400;
   const popIndex = seq(1, popSize, popSize);
   const colors = ["#ff0000", "#0000ff"];

   // variable parameters
   let popProp = 0.50;
   let sampSize = 5;

   function takeNewSample() {
      sample = subset(shuffle(popIndex), seq(1, sampSize, sampSize));
   }

   // generate groups of population randomly
   $: groups = shuffle(rep(1, Math.round(popProp * popSize)).concat(rep(2, Math.round((1 - popProp) * popSize))));

   // take a sample if population proportion has changed
   $: sample = popProp ? subset(shuffle(popIndex), seq(1, sampSize, sampSize)) : NULL;
</script>

<StatApp>
   <div class="app-layout">

      <!-- plot for population individuals  -->
      <div class="app-population-plot-area">
         <PopulationPlot {groups} {sample} {colors} />
      </div>

      <!-- plot for sample individuals -->
      <div class="app-sample-plot-area">
         <SamplePlot {groups} {sample} {colors} />
      </div>

      <!-- confidence intervals and statistic table -->
      <div class="app-ci-plot-area">
         <CIPlot {groups} {sample} {colors} />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlRange id="popProp" label="Proportion" bind:value={popProp} min={0.1} max={0.9} step={0.01} decNum={2} />
            <AppControlSwitch id="sampleSize" label="Sample size" bind:value={sampSize} options={[5, 10, 20, 40]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>Population based confidence interval for proportion</h2>
      <p>
         This app allows you to play with proportion of a random sample. Here we have a population with N = 400
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
         the interval (table under the plot shows this information). If you repeat this many (hundreds) times, about
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
      "pop controls";
   grid-template-rows: 150px 1fr 1fr;
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
   min-height: 150px;
}

.app-sample-plot-area {
   height: 150px;
}

.app-ci-plot-area {
   grid-area: ciplot;
}

.app-controls-area {
   grid-area: controls;
}

</style>