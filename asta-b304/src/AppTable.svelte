<script>
   import { Vector } from 'mdatools/arrays';
   import { sum } from 'mdatools/stat';
   import DataTable from '../../shared/tables/DataTable.svelte';

   export let sampModel;
   export let selectedPoint;

   // link to data table container
   let t;

   $: sampE = sampModel.data.y.subtract(sampModel.fitted);
   $: sampE2 = sampE.mult(sampE);

   $: {
      // add style for selected point
      if (t) {
         const rows = Array.from(t.querySelectorAll("tr"));
         rows.filter((x, i) => i == selectedPoint).map(v => v.classList.add("selected"));
         rows.filter((x, i) => i != selectedPoint).map(v => v.classList.remove("selected"));
      }
   }

</script>

<div class="table-container" bind:this={t}>
<DataTable
   variables={[
      {label: "x", values: Vector.c(sampModel.data.X.getcolumn(1), 0)},
      {label: "y", values: Vector.c(sampModel.data.y, 0)},
      {label: "y<sub>p</sub>", values: Vector.c(sampModel.fitted, 0)},
      {label: "e", values: Vector.c(sampE, 0)},
      {label: "e<sup>2</sup>", values: Vector.c(sampE2, sum(sampE2))}

   ]}
   decNum={[2, 1, 1, 2, 2]}
   horizontal={false}
/>
</div>


<style>

.table-container {
   padding: 1em;
}

:global(.datatable) {
   width: 100%;
   font-size: 0.9em;
}

:global(.datatable .datatable__label) {
   text-align: right;
   border-bottom: 1px solid #909090;
}

:global(.datatable .datatable__row.selected .datatable__value) {
   background: #33668830;
   color: #336688;
   font-weight: bold;
}


:global(.datatable tr .datatable__value) {
   border-bottom: 1px solid #ffffff;
}

:global(.datatable tr:last-child  .datatable__value) {
   visibility: hidden;
}

:global(.datatable tr:last-child  .datatable__value:last-child) {
   visibility: visible;
   font-weight: bold;
}

</style>

