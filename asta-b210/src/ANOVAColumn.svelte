<script>
   import { sum } from "stat-js";

   import DataTable  from "../../shared/DataTable.svelte";
   import ANOVATable from "./ANOVATable.svelte";
   import ANOVAPlot from "./ANOVAPlot.svelte";

   export let effectExpected;
   export let noiseExpected;

   export let labels;
   export let samples;
   export let DoF;
   export let colors;
   export let sign;

   // we bind MS value to this variable for parent block
   export let value = 0;

   $: SSQ = sum(samples.map(v => sum(v.map(x => x**2))));
   $: MS = SSQ / DoF;
   $: value = MS;
</script>

<div class="anova-column">
   <ANOVATable {labels} values={samples} />
   <div class="sign">
      <span>{sign}</span>
   </div>
   <DataTable variables={[
      {label: "DoF", values: [DoF]},
      {label: "SSQ", values: [SSQ]},
      {label: "MS", values: [MS]}
   ]} decNum={[1, 1, 1]} horizontal={true} />
   <ANOVAPlot color="{colors[0]}" boxColor="{colors[1]}" popMeans={effectExpected} popSigma={noiseExpected} samples={samples}  />
</div>

<style>

   .anova-column {
      height: 100%;
      display: grid;
      grid-template-areas:
         "sign table"
         ". stat"
         ". plot";
      grid-template-rows: min-content min-content 1fr;
      grid-template-columns: min-content 1fr;
   }

   .anova-column > :global(.datatable) {
      grid-area: stat;
      font-size: 1.15em;
      border-top: solid 3px white;
      border-bottom: solid 3px white;
   }

   .anova-column > :global(.datatable  .datatable__label) {
      padding: 0.15em;
      padding-left: 20px;
   }

   .anova-column > :global(.datatable  .datatable__value) {
      padding: 0.25em;
      padding-right: 20px;
   }

   .anova-column > :global(.plot) {
      grid-area: plot;
   }
</style>