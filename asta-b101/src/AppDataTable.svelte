<script>
   import DataTable from "../../shared/tables/DataTable.svelte";
   export let sample;

</script>

<DataTable
   variables={[
      {label: "i", values: sample.i},
      {label: "x", values: sample.x},
      {label: "p", values: sample.p}
   ]}
   decNum={[0, 1, 3]}
   horizontal={true}
/>
