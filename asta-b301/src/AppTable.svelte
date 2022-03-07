<script>
   import {sum} from 'mdatools/stat';
   import DataTable from "../../shared/tables/DataTable.svelte"

   export let sampX;
   export let sampY;
   export let indNeg;
   export let indPos;
   export let indNeu;
   export let sampMeanX;
   export let sampMeanY
   export let selectedPoint;

   // link to data table container
   let t;

   // compute distances between x and y values and corresponding mean
   $: diffX = sampX.map(x => x - sampMeanX)
   $: diffY = sampY.map(y => y - sampMeanY)

   // compute product of the distances
   $: gang = diffX.map((x, i) => diffX[i] * diffY[i])

   $: {
      // add style for selected point
      if (t) {
         const rows = Array.from(t.querySelectorAll("tr"));
         rows.filter((x, i) => i == selectedPoint).map(v => v.classList.add("selected"));
         rows.filter((x, i) => i != selectedPoint).map(v => v.classList.remove("selected"));
      }
   }

   $: {
      // add classes to the table rows depending on the contribution (negative/positive)
      if (t) {
         const rows = Array.from(t.querySelectorAll("tr"));
         rows.filter((x, i) => indNeg.includes(i)).map(v => {v.classList.remove("positive", "neutral"); v.classList.add("negative")});
         rows.filter((x, i) => indPos.includes(i)).map(v => {v.classList.remove("negative", "neutral"); v.classList.add("positive")});
         rows.filter((x, i) => indNeu.includes(i)).map(v => {v.classList.remove("positive", "negative"); v.classList.add("neutral")});
      }
   }

</script>

<div class="table-container" bind:this={t}>
<DataTable
   variables={[
      {label: "x", values: sampX.concat([0])},
      {label: "y", values: sampY.concat([0])},
      {label: "(x – m)", values: diffX.concat([0])},
      {label: "(y – m)", values: diffY.concat([0])},
      {label: "prod", values: gang.concat([sum(gang)])}

   ]}
   decNum={[1, 1, 1, 1, 1]}
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

:global(.datatable .datatable__row.positive .datatable__value) {
   background: #ff000010;
   color: #662222;
}

:global(.datatable .datatable__row.positive.selected .datatable__value) {
   background: #a00000;
   color: #fff0f0;
}

:global(.datatable .datatable__row.negative .datatable__value) {
   background: #0000ff10;
   color: #222266;
}

:global(.datatable .datatable__row.negative.selected .datatable__value) {
   background: #0000aa;
   color: #f0f0ff;
}

:global(.datatable .datatable__row.neutral .datatable__value) {
   background: #f6f6f6;
   color: #a0a0a0;
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

