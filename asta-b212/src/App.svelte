<script>
   import { Vector, vector } from 'mdatools/arrays';
   import { mean } from 'mdatools/stat';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';
   import ANOVABoxplot from '../../shared/plots/ANOVABoxplot.svelte';

   // local components
   import ANOVATable from './ANOVATable.svelte';
   import ANOVASysColumn from './ANOVASysColumn.svelte';
   import ANOVAErrColumn from './ANOVAErrColumn.svelte';

   // constant parameters
   const sampSize = 5;
   const labels = ['A', 'B', 'C'];
   const noiseExpected = 10;

   // needed to make first sample predefined
   let firstSample = true;

   // population parameters, which can vary
   let muA = 100;
   let muB = 100;
   let muC = 100;

   // parameters to reset statistics
   let oldMuA = muA;
   let oldMuB = muB;
   let oldMuC = muC;
   let reset = false;
   let clicked;

   $: {
      if (sample && (oldMuA !== muA || oldMuB !== muB || oldMuC !== muC)) {
         reset = true;
         oldMuA = muA;
         oldMuB = muB;
         oldMuC = muC;
         takeNewSample();
      } else {
         reset = false;
      }
   }

   // current sample and its parts
   let sample, grandMean, sysSample, errSample;

   function takeNewSample() {

      if (firstSample) {
         sample = [
            vector([85,  90,  95, 100, 105]),
            vector([90,  95, 100, 105, 110]),
            vector([95, 100, 105, 110, 115]),
         ];
         firstSample = false;
      } else {
         sample = [
            Vector.randn(sampSize, muA, noiseExpected),
            Vector.randn(sampSize, muB, noiseExpected),
            Vector.randn(sampSize, muC, noiseExpected),
         ];
      }

      clicked = Math.random();
   }

   $: sampleMeans = sample.map(v => mean(v));
   $: grandMean = mean(sampleMeans);
   $: sysSample = sampleMeans.map(v => Vector.fill(v, sampSize));
   $: errSample = sample.map((v, i) => v.subtract(sampleMeans[i]));

   // take first sample
   takeNewSample();
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-original-data-area">
         <!-- original values table and the sign -->
         <ANOVATable {labels} values={sample} />
         <ANOVABoxplot limX={[-0.5, 2.3]} limY={[50, 150]} popSigma={noiseExpected} popMeans={[muA, muB, muC]} samples={sample} />

         <!-- Control elements -->
         <AppControlArea>
            <AppControlRange
               id="effectA" label="µ<sub>A</sub>"
               bind:value={muA} min={90} max={110} step={1} decNum={0}
            />
            <AppControlRange
               id="effectB" label="µ<sub>B</sub>"
               bind:value={muB} min={90} max={110} step={1} decNum={0}
            />
            <AppControlRange
               id="effectC" label="µ<sub>C</sub>"
               bind:value={muC} min={90} max={110} step={1} decNum={0}
            />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

      <div class="app-data-area app-systematic-data-area">
         <ANOVASysColumn mainColor="#66aa88" {sysSample} {errSample} {labels} {clicked} {reset} />
      </div>

      <div class="app-data-area app-error-data-area">
         <ANOVAErrColumn mainColor="#aa6644" {errSample} {labels} />
      </div>
   </div>

   <div slot="help">
      <h2>One way ANOVA (full)</h2>
      <p>
         This app is almost identical to the <code>asta-b211</code> but here we show calculations as they
         are without substracting the global mean in advance. The results are absolutely identical but this time
         without additional step of unbiasing the values. Plus the app shows importance of QQ plot for residuals
         which helps to assess their normality.
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
   flex: 0 1 34%;

   display: grid;
   grid-template-areas:
      "table"
      "plot"
      "controls"
      ".";

   grid-template-rows: min-content max(200px, 35%) min-content auto;
   grid-template-columns: 1fr min-content;
}

:global(.sign) {
   grid-area: sign;
   text-align: center;
   padding: 0 0.5em;
   font-size: 1.5em;
   font-weight: bold;

   color: black;
   height: 100%;
   display: flex;
   flex-direction: column;
   justify-content:center;
   align-items: center;
}

.app-original-data-area  > :global(.anova-table) {
   padding: 0 2em 0 1em;
}

.app-original-data-area  > :global(.plot) {
   grid-area: plot;
   padding-left: 1em;
}

.app-original-data-area  > :global(.app-control-block) {
   margin-top: 1em;
   grid-area: controls;
}


/* column with systematic/error data */

.app-data-area {
   flex: 0 1 33%;
}

.app-data-area  > :global(.anova-column .anova-table) {
   padding: 0 1.5em 0 1em;
}

.app-data-area > :global(.anova-column > .datatable  tr:last-of-type > .datatable__value) {
   font-weight: bold;
}

/* column with systematic data */
.app-systematic-data-area :global(.datatable),
.app-systematic-data-area :global(.plot),
.app-systematic-data-area  > :global(.anova-column .anova-table) {
   background: #f0f6f0;
}

.app-systematic-data-area > :global(.anova-column > .datatable  tr:last-of-type > .datatable__value) {
   color: #66aa88;
}

/* column with error data */
.app-error-data-area  > :global(.anova-column .anova-table),
.app-error-data-area :global(.datatable),
.app-error-data-area :global(.plot){
   background: #f8f4f0;
}

.app-error-data-area > :global(.anova-column > .datatable  tr:last-of-type > .datatable__value) {
   color: #aa6644;
}
</style>