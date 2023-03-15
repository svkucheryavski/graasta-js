<script>
   import { Vector } from 'mdatools/arrays';
   import { sum } from 'mdatools/stat';
   import DataTable from '../../shared/tables/DataTable.svelte'

   export let splits;
   export let indSeg;
   export let x;
   export let y;
   export let ycv;


   let t;

   $: e = y.subtract(ycv);
   $: e2 = e.mult(e);

   $: t ? t.querySelectorAll('table > tr').forEach(e => {
         e.classList.remove('selected')
         const c = e.querySelector('.datatable__value');
         if  (c && c.innerHTML === (indSeg + 1).toString()) {
            e.classList.add('selected')
         }
      }) : '';

   $: console.log(Vector.c(e2, sum(e2)))
</script>

<div class="table-container" bind:this={t}>
<DataTable
   variables={[
      {label: "#", values: [...Array.from(splits.v), NaN]},
      {label: "x", values: Vector.c(x, NaN)},
      {label: "y", values: Vector.c(y, NaN)},
      {label: "y<sub>cv</sub>", values: Vector.c(ycv, NaN)},
      {label: "e", values: Vector.c(e, NaN)},
      {label: "e<sup>2</sup>", values: Vector.c(e2, sum(e2))}

   ]}
   decNum={[0, 2, 1, 1, 2, 2]}
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

:global(.datatable tr td) {
   width: 18%;
}
:global(.datatable tr td:first-child) {
   width: 10%;
}

:global(.datatable .datatable__label) {
   text-align: right;
   border-bottom: 1px solid #909090;
}

:global(.datatable .datatable__row.selected .datatable__value) {
   background: #33668820;
   color: #336688;
}


:global(.datatable tr .datatable__value) {
   border-bottom: 1px solid #ffffff;
}

:global(.datatable tr:last-child  .datatable__value:last-child) {
   visibility: visible;
   font-weight: bold;
}

</style>

