<script>
   import {seq, subset, rep, shuffle} from 'stat-js';

   // children blocks
   import PopulationPlot from '../../asta-b201/src/PopulationPlot.svelte';
   import SamplePlot from '../../asta-b201/src/SamplePlot.svelte';
   import CIPlot from './CIPlot.svelte';

   // common blocks
   import {default as StatApp} from '../../shared/StatApp.svelte';
   import AppControlArea from '../../shared/AppControlArea.svelte';
   import AppControlButton from '../../shared/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/AppControlSwitch.svelte';
   import AppControlRange from '../../shared/AppControlRange.svelte';

   // size of population and vector with element indices
   const popSize = 1600;
   const popIndex = seq(1, popSize, popSize);
   const colors = ["#ff0000", "#0000ff"];

   // variable parameters
   let popProp = 0.50;
   let sampSize = 10;

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
         sampe many times (say, 200-300) you can see how often the population proportion, π, was inside the
         interval. If sample size is large enough it should be close to 95% — the confidence level.
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
   grid-template-rows: 150px 150px auto auto;
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

.app-ci-plot-area :global(.plot) {
   min-height: 150px;
}

.app-controls-area {
   padding-top: 10px;
   grid-area: controls;
}

</style>