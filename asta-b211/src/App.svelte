<script>
   import {rep, mean, rnorm} from "stat-js";

   // shared components
   import {default as StatApp} from "../../shared/StatApp.svelte";

   // shared components - controls
   import AppControlArea from "../../shared/controls/AppControlArea.svelte";
   import AppControlButton from "../../shared/controls/AppControlButton.svelte";
   import AppControlRange from "../../shared/controls/AppControlRange.svelte";

   // local components
   import ANOVATable from "./ANOVATable.svelte";
   import ANOVAColumn from "./ANOVAColumn.svelte";
   import TestPlot from "./TestPlot.svelte";

   // constant parameters
   const globalMean = 100;
   const sampSize = 5;
   const nGroups = 3;
   const labels = ["A", "B", "C"];

   // degrees of freedom
   const DoFTotal = sampSize * nGroups - 1;
   const DoFSys = nGroups - 1;
   const DoFErr = DoFTotal - DoFSys;

   // needed to make first sample predefined
   let firstSample = true;

   // population parameters, which can vary
   let muA = 0;
   let muB = 0;
   let muC = 0;
   let noiseExpected = 10;

   // parameters to reset statistics
   let oldMuA = muA;
   let oldMuB = muB;
   let oldMuC = muC;
   let oldNoiseExpected = noiseExpected;
   let reset = false;
   let clicked;

   $: {
      if (sample && (oldMuA !== muA || oldMuB !== muB || oldMuC !== muC || oldNoiseExpected !== noiseExpected)) {
         reset = true;
         oldMuA = muA;
         oldMuB = muB;
         oldMuC = muC;
         oldNoiseExpected = noiseExpected;
         takeNewSample();
      } else {
         reset = false;
      }
   }

   // current sample and its parts
   let sample, grandMean, unbiasedSample, sysSample, errSample;

   function takeNewSample() {

      if (firstSample) {
         sample = [
            [ 85,  90,  95, 100, 105],
            [ 90,  95, 100, 105, 110],
            [ 95, 100, 105, 110, 115],
         ];
         firstSample = false;
      } else {
         sample = [
            rnorm(sampSize, globalMean + muA, noiseExpected),
            rnorm(sampSize, globalMean + muB, noiseExpected),
            rnorm(sampSize, globalMean + muC, noiseExpected),
         ];
      }

      const sampleMeans = sample.map(v => mean(v));
      grandMean = mean(sampleMeans);
      unbiasedSample = sample.map(v => v.map(x => x - grandMean));

      const unbiasedSampleMeans = unbiasedSample.map(v => mean(v));
      sysSample = unbiasedSampleMeans.map(v => rep(v, sampSize));
      errSample = unbiasedSample.map((v, i) => v.map(x => x - unbiasedSampleMeans[i]));

      clicked = Math.random();
   }

   // combine population means to a vector for easy handling
   $: effectExpected = [muA, muB, muC];

   // take first sample
   takeNewSample();
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-original-data-area">
         <!-- original values table and the sign -->
         <ANOVATable {labels} values={sample} />
         <div class="sign">
            <span>&minus;&nbsp;{grandMean.toFixed(1)}</span>
         </div>

         <!-- F-distribution plot -->
         <TestPlot {reset} {clicked} {errSample} {sysSample} />

         <!-- Control elements -->
         <AppControlArea>
            <AppControlRange
               id="effectA" label="µ – µ<sub>A</sub>"
               bind:value={muA} min={-10} max={10} step={1} decNum={0}
            />
            <AppControlRange
               id="effectB" label="µ – µ<sub>B</sub>"
               bind:value={muB} min={-10} max={10} step={1} decNum={0}
            />
            <AppControlRange
               id="effectC" label="µ – µ<sub>C</sub>"
               bind:value={muC} min={-10} max={10} step={1} decNum={0}
            />
            <AppControlRange
               id="noise" label="Noise (σ)"
               bind:value={noiseExpected} min={5} max={15} step={1} decNum={0}
            />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

      <div class="app-unbiased-data-area">
         <ANOVAColumn {effectExpected} {noiseExpected} {labels}
            sign="=" DoF = {DoFTotal} samples={unbiasedSample}
            colors={["#202020", "#d0d0d0"]}
         />
      </div>

      <div class="app-systematic-data-area">
         <ANOVAColumn {effectExpected} {noiseExpected} {labels}
            sign="=" DoF={DoFSys} samples={sysSample}
            colors={["#106020", "#d0e0d0"]}
         />
      </div>


      <div class="app-error-data-area">
         <ANOVAColumn {effectExpected} {noiseExpected} {labels}
            sign="+" DoF = {DoFErr} samples={errSample}
            colors={["#602010", "#e0d8d0"]}
         />
      </div>
   </div>

   <div slot="help">
      <h2>One way ANOVA</h2>
      <p>
         This app shows how one-way ANOVA tests means of three samples — the outcomes of a chemical reaction running
         using three different catalysis: <em>A</em>, <em>B</em> and <em>C</em>. We "run" the reaction with each
         catalyst 5 times, which gives 15 values — yield of each run in mg. The obtained yield values are shown in
         the top left table. The last row shows the average yield for each catalyst. You can adjust the
         expected effect for each catalyst and noise using slider controls.
      </p>
      <p>
         Then app computes a global mean for all original values and subtract it from the values thus creating a
         table with unbiased values, which are shown in the gray column. Table in the top of the column contains
         the unbiased values and their means. Under the table there are statistics: degrees of freedom (DoF), sum of squared values (SSQ)
         and variance or mean squares (MS = SSQ/DoF). Plot below shows boxplots for populations and
         points for the values.
      </p>
      <p>
         After that we split the unbiased values into a sum of <em>systematic</em> part, shown in the green column, and
         the <em>residuals</em>, shown in the red column. In the systematic part we assume there is no noise,
         so all outcomes for given factor level (e.g. column A) have the same value — the corresponding mean. Residuals
         are computed as a difference between the unbiased values and the systematic part. App computes DoF, SSQ
         and MS for each part and the F-value — which is a ratio of MS for systematic part and residuals. The F-value
         follows F-distribution shown under the original data table. We use this distribution
         to compute corresponding p-value and make decision about the H0.
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
      "table sign"
      "plot plot"
      "controls controls"
      ". .";
   grid-template-rows: min-content 1fr min-content auto;
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

.app-original-data-area  > :global(.plot) {
   min-height: 130px;
   height: 100%;
   grid-area: plot;
}

.app-original-data-area  > :global(.plot) {
   grid-area: plot;
}

.app-original-data-area  > :global(.app-control-area) {
   margin-top: 1em;
   grid-area: controls;
}


/* column with unbiased data */

.app-unbiased-data-area{
   flex: 0 1 22%;
}

.app-unbiased-data-area :global(.datatable),
.app-unbiased-data-area :global(.plot){
   background: #f6f6f6;
}

.app-unbiased-data-area > :global(.anova-column > .datatable  tr:last-of-type > .datatable__value) {
   font-weight: bold;
   color: #666666;
}


/* column with systematic data */

.app-systematic-data-area {
   flex: 0 1 22%;
}

.app-systematic-data-area :global(.datatable),
.app-systematic-data-area :global(.plot){
   background: #f0f6f0;
}

.app-systematic-data-area > :global(.anova-column > .datatable  tr:last-of-type > .datatable__value) {
   font-weight: bold;
   color: #66aa88;
}


/* column with error data */

.app-error-data-area {
   flex: 0 1 22%;
}

.app-error-data-area :global(.datatable),
.app-error-data-area :global(.plot){
   background: #f8f4f0;
}

.app-error-data-area > :global(.anova-column > .datatable  tr:last-of-type > .datatable__value) {
   font-weight: bold;
   color: #aa6644;
}

</style>