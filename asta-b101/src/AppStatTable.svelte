<script>
   import DataTable from '../../shared/tables/DataTable.svelte';
   export let stats;
</script>

<DataTable
   variables={[
      {label: "min", values: [stats.min] },
      {label: "Q1",  values: [stats.quartiles[0]]},
      {label: "Q2",  values: [stats.quartiles[1]]},
      {label: "mean",values: [stats.mean]},
      {label: "Q3",  values: [stats.quartiles[2]]},
      {label: "max", values: [stats.max] }
   ]}
   decNum={[1, 1, 1, 1, 1, 1, 1]}
   horizontal={true}
/>
