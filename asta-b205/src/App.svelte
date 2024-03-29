<script>
   import { Vector } from 'mdatools/arrays';
   import { sum } from 'mdatools/stat';

   // shared components
   import { default as StatApp } from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // shared components - tables
   import DataTable from '../../shared/tables/DataTable.svelte';

   // local components
   import OutcomesPlot from './OutcomesPlot.svelte';
   import SamplePlot from './SamplePlot.svelte';

   // signs for different H0 tails
   const signs = {'both': '=', 'left': '≥', 'right': '≤'};

   // variable parameters
   let sampSize = 4;
   let sample;
   let tail = 'both';

   // number of outcomes [same extreme, more extreme, less extreme] - is binded
   let N = [];

   // function to get a new sample based on uniform distribution
   function takeNewSample() {
      return Vector.rand(sampSize).v.map(x => (x > 0.5));
   }

   // take new sample when sample size is changed
   $: sample = takeNewSample(sampSize);

   // strings for statistics table
   $: h0Str = `π(<span style="color:#336688">o</span>) ${signs[tail]} 0.5`;
   $: sampPropStr = (sum(sample) / sample.length).toFixed(3);
   $: pValStr = N.length == 3 ? `(${N[1]}+${N[0]})/(${N[1]}+${N[0]}+${N[2]}) =
      ${((N[1] + N[0]) / sum(N)).toFixed(3)}` : "";
</script>

<StatApp>
   <div class="app-layout">

      <!-- plot for possible outcomes (population) -->
      <div class="app-outcomes-plot-area">
         <OutcomesPlot {sample} {tail} bind:value={N} />
      </div>

      <!-- plot with current sample  -->
      <div class="app-sample-plot-area">
         <SamplePlot {sample} />
      </div>

      <!-- statistic table -->
      <div class="app-stattable-area">
         <DataTable
            variables={[
               {label: "Null hypothesis:", values: [h0Str]},
               {label: "Sample proportion:", values: [sampPropStr]},
               {label: "p-value:", values: [pValStr]},
            ]}
            decNum={[-1, -1, -1]}
            horizontal={true}
         />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlSwitch id="tail" label="Tail" bind:value={tail} options={["left", "both", "right"]} />
            <AppControlSwitch id="sampleSize" label="Sample size" bind:value={sampSize} options={[4, 6]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={() => sample = takeNewSample()} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>What is p-value?</h2>
      <p>
         This app helps to understand the meaning of a p-value in hypotheses testing:
      </p>
      <p><em>
         p-value is a chance to get a sample as extreme as the one you have or even more extreme assuming
         that the null hypothesis (H0) is true.
      </em></p>

      <p>
         In case if all outcomes of an experiment are equally likely, to compute a p-value we need to
         know: <em>N1</em> — number of possible outcomes which will be as extreme as the one we currently
         have, <em>N2</em> — number of outcomes which will be more extreme for given H0, and <em>N</em> —
         total number of all possible outcomes. In this case the p-value can be computed as:
         <strong>p = (N1 + N2)/N</strong>.
      </p>
      <p>
         However, when we deal with continuous variables, number of possible outcomes is infinite and
         different outcomes may have different probabilities, therefore we have to use theoretical distributions for
         computing chances, which will be also shown in next apps. But in this app we introduce p-values based on
         experiment with limited number of outcomes — tossing a balanced coin several times
         (4 or 6). So we can count <em>N1</em>, <em>N2</em> and <em>N</em> and compute the p-value manually.
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
      "pop sample"
      "pop stattable"
      "pop controls"
      "pop .";
   grid-template-rows: 150px auto auto 1fr;
   grid-template-columns: 60% 40%;
}


.app-outcomes-plot-area {
   grid-area: pop;
   padding-right: 20px;
   display: flex;
}

.app-outcomes-plot-area  :global(.plot) {
   min-width: 150px;
}

.app-sample-plot-area {
   grid-area: sample;
}

.app-sample-plot-area :global(.plot) {
   min-height: 150px;
}

.app-stattable-area {
   grid-area: stattable;
   padding-bottom: 2em;
}

.app-stattable-area :global(.datatable) {
   font-size: 1em;
   color: #606060;
}

.app-stattable-area :global(.datatable__label) {
   font-weight: normal;
}

.app-stattable-area :global(.datatable__value) {
   padding-left: 1em;
   font-weight: bold;
   color: #505050;
}

.app-controls-area {
   grid-area: controls;
}

</style>