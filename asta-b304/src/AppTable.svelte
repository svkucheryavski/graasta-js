<script>
   import {sum} from 'mdatools/stat';
   import {vsubtract, vmult} from 'mdatools/matrix';
   import DataTable from "../../shared/tables/DataTable.svelte"

   export let sampModel;
   export let selectedPoint;

   // link to data table container
   let t;

   $: sampE = vsubtract(sampModel.data.y, sampModel.fitted);
   $: sampE2 = vmult(sampE, sampE);

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
      {label: "x", values: sampModel.data.X[0].concat([0])},
      {label: "y", values: sampModel.data.y.concat([0])},
      {label: "y<sub>p</sub>", values: sampModel.fitted.concat([0])},
      {label: "e", values: sampE.concat([0])},
      {label: "e<sup>2</sup>", values: sampE2.concat(sum(sampE2))}

   ]}
   decNum={[1, 1, 1, 1, 2]}
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

