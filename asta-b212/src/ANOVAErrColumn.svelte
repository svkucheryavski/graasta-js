<script>
   import { Vector } from 'mdatools/arrays';
   import { sum, ssq } from 'mdatools/stat';
   import { QQPlot } from 'mdatools-plots/stat';

   import DataTable  from '../../shared/tables/DataTable.svelte';
   import ANOVATable from "./ANOVATable.svelte";

   export let errSample;
   export let labels;
   export let mainColor = '#a0a0a0';

   $: DoF = errSample.length * (errSample[0].length - 1);
   $: SSQ = sum(errSample.map(v => ssq(v)));
   $: MS = SSQ / DoF;
</script>

<div class="anova-column">
   <ANOVATable {labels} values={errSample} />
   <div class="sign">
      <span>+</span>
   </div>
   <DataTable variables={[
      {label: "DoF", values: [DoF]},
      {label: "SSQ", values: [SSQ]},
      {label: "MS", values: [MS]}
   ]} decNum={[1, 1, 1]} horizontal={true} />
   <QQPlot xLabel="" yLabel="" borderColor={mainColor} lineColor={mainColor} values={Vector.c(...errSample)} />
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