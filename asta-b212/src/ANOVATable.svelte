<script>
   import { Vector } from 'mdatools/arrays';
   import { mean } from 'mdatools/stat';

   import DataTable from '../../shared/tables/DataTable.svelte';

   export let labels;
   export let values;
   export let showMean = true;
   export let decNum = 1;

   $: data = showMean ?
      values.map((v, i) =>  ({"label": labels[i], "values": Vector.c(v, mean(v))})) :
      values.map((v, i) =>  ({"label": labels[i], "values": v}));
</script>

<div class="anova-table">
<DataTable variables={data} decNum={Array(values.length).fill(decNum)} horizontal={false} />
</div>

<style>
   .anova-table {
      grid-area: table;
      margin: 0;
      padding: 0;
   }

   .anova-table > :global(.datatable) {
      width: 100%;
      color: #404040;
      text-align: right;
   }

   .anova-table :global(.datatable > tr:first-of-type) {
      border-bottom: solid 1px #a0a0a0;
   }

   .anova-table :global(.datatable > tr:last-of-type) {
      border-top: solid 1px #e0e0e0;
   }

   .anova-table :global(.datatable > tr:last-of-type > .datatable__value) {
      font-weight: bold;
   }
</style>