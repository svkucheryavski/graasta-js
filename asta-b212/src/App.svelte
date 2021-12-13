<script>
   import {rnorm, mean, rep} from "stat-js";

   // shared components
   import {default as StatApp} from "../../shared/StatApp.svelte";

   // shared components - controls
   import AppControlArea from "../../shared/controls/AppControlArea.svelte";
   import AppControlButton from "../../shared/controls/AppControlButton.svelte";
   import AppControlRange from "../../shared/controls/AppControlRange.svelte";

   // local components
   import ANOVATable from "./ANOVATable.svelte";
   import ANOVASysColumn from "./ANOVASysColumn.svelte";
   import ANOVAErrColumn from "./ANOVAErrColumn.svelte";

   // constant parameters
   const globalMean = 100;
   const sampSize = 5;
   const nGroups = 3;
   const labels = ["A", "B", "C"];

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
   let sample, grandMean, sysSample, errSample;

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
            rnorm(sampSize, muA, noiseExpected),
            rnorm(sampSize, muB, noiseExpected),
            rnorm(sampSize, muC, noiseExpected),
         ];
      }

      clicked = Math.random();
   }

   $: sampleMeans = sample.map(v => mean(v));
   $: grandMean = mean(sampleMeans);
   $: sysSample = sampleMeans.map(v => rep(v, sampSize));
   $: errSample = sample.map((v, i) => v.map(x => x - sampleMeans[i]));

   // take first sample
   takeNewSample();
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-original-data-area">
         <!-- original values table and the sign -->
         <ANOVATable {labels} values={sample} />

         <!-- Control elements -->
         <AppControlArea>
            <AppControlRange
               id="effectA" label="µ<sub>A</sub>"
               bind:value={muA} min={-10} max={10} step={1} decNum={0}
            />
            <AppControlRange
               id="effectB" label="µ<sub>B</sub>"
               bind:value={muB} min={-10} max={10} step={1} decNum={0}
            />
            <AppControlRange
               id="effectC" label="µ<sub>C</sub>"
               bind:value={muC} min={-10} max={10} step={1} decNum={0}
            />
            <AppControlRange
               id="noise" label="Noise (σ)"
               bind:value={noiseExpected} min={5} max={15} step={1} decNum={0}
            />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

      <div class="app-systematic-data-area">
         <ANOVASysColumn {sysSample} {errSample} {labels} {clicked} {reset} />
      </div>

      <div class="app-error-data-area">
         <ANOVAErrColumn {errSample} {labels} />
      </div>
   </div>

   <div slot="help">
      <h2>One way ANOVA (full)</h2>
      <p>
         This app is almost identical to the <code>asta-b211</code> but here we show calculations as they
         are without sbstracting the global mean in advance. The results are absolutly identical but
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
      "controls"
      ".";
   grid-template-rows: min-content min-content auto;
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


/* column with systematic data */

.app-systematic-data-area {
   flex: 0 1 33%;
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
   flex: 0 1 33%;
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