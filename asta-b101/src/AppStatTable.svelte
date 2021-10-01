<script>
   import {quantile, mean} from 'stat-js';
   import {DataTable} from 'svelte-plots-stat';

   export let values;

   $: Q1 = quantile(values, 0.25);
   $: Q2 = quantile(values, 0.50);
   $: Q3 = quantile(values, 0.75);
   $: m = mean(values);
   $: sampleSize = values.length;
</script>

<DataTable
   variables={[
      {label: "min", values:[values[0]] },
      {label: "Q1", values: [Q1]},
      {label: "Q2", values: [Q2]},
      {label: "mean", values: [m]},
      {label: "Q3", values: [Q3]},
      {label: "max", values:[values[sampleSize - 1]] }
   ]}
   decNum={[1, 1, 1, 1, 1, 1, 1]}
   horizontal={true}
/>
