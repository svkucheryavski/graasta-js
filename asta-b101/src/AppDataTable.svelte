<script>
   import { Vector } from 'mdatools/arrays';
   import DataTable from '../../shared/tables/DataTable.svelte';

   export let sample;

   $: n = sample.length;
   $: ranks = Vector.seq(1, n);
   $: percentages = Vector.seq(1, n).apply(v => (v - 0.5) / n);

</script>

{#if n > 0}
<DataTable
   variables={[
      {label: "i", values: ranks},
      {label: "x", values: sample},
      {label: "p", values: percentages}
   ]}
   decNum={[0, 1, 3]}
   horizontal={true}
/>
{/if}
