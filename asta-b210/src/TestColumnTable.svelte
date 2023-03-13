<script>
   import { mean } from 'mdatools/stat';
   import { c, vector } from 'mdatools/arrays';

   // shared components - table
   import DataTable from '../../shared/tables/DataTable.svelte';

   export let labels;
   export let samples;
   export let showMean = true;
   export let decNum = 1;

   $: data = showMean ?
      samples.map((v, i) =>  ({'label': labels[i], 'values': c(v, vector([mean(v)]))})) :
      samples.map((v, i) =>  ({'label': labels[i], 'values': v}));

</script>

<div class="test-table">
<DataTable variables={data} decNum={Array(samples.length).fill(decNum)} horizontal={false} />
</div>

<style>
   .test-table {
      grid-area: table;
      box-sizing: border-box;
      margin: 0;
   }

   .test-table > :global(.datatable) {
      width: auto;
      margin: 0 auto;
      color: #404040;
      text-align: right;
   }

   .test-table :global(.datatable td) {
      padding: 0.25em 1em;
   }

   .test-table :global(.datatable > tr:first-of-type) {
      border-bottom: solid 1px #a0a0a0;
   }

   .test-table :global(.datatable > tr:last-of-type) {
      border-top: solid 1px #e0e0e0;
   }

   .test-table :global(.datatable > tr:last-of-type > .datatable__value) {
      font-weight: bold;
   }
</style>