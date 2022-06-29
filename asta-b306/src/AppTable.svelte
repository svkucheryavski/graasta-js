<script>
   import {sum} from 'mdatools/stat';
   import {vsubtract, vmult} from 'mdatools/matrix';
   import DataTable from "../../shared/tables/DataTable.svelte"

   export let segments;
   export let indSeg;
   export let x;
   export let y;
   export let ycv;


   let t;

   $: e = vsubtract(y, ycv);
   $: e2 = vmult(e, e);

   $: t ? t.querySelectorAll("table > tr").forEach(e => {
         e.classList.remove("selected")
         const c = e.querySelector(".datatable__value");
         if  (c && c.innerHTML === (indSeg + 1).toString()) {
            e.classList.add("selected")
         }
      }) : "";
</script>

<div class="table-container" bind:this={t}>
<DataTable
   variables={[
      {label: "#", values: segments.num.concat([NaN])},
      {label: "x", values: x.concat([NaN])},
      {label: "y", values: y.concat([NaN])},
      {label: "y<sub>cv</sub>", values: ycv.concat([NaN])},
      {label: "e", values: e.concat([NaN])},
      {label: "e<sup>2</sup>", values: e2.concat(sum(e2))}

   ]}
   decNum={[0, 2, 1, 1, 1, 2]}
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

