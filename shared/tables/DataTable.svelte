<script>
   import { isindex, isvector } from 'mdatools/arrays';
   import { min, diff } from 'mdatools/stat';
   import DataTableValues from './DataTableValues.svelte';

   export let variables = [];
   export let horizontal = false;
   export let decNum = undefined;

   function getDecimalsNum(x) {
      const dec = Math.log10(min(diff(x).map(v => Math.abs(v))));
      return Math.abs(dec < 0 ? Math.floor(dec) : Math.ceil(dec));
   }

   $: decNum === undefined ? variables.map(v => getDecimalsNum(v.values)) : decNum;
</script>

<table class="datatable">

{#if horizontal }
   {#each variables as {label, values}, i}
   <tr class="datatable__row">
      <td class="datatable__label">{@html label}</td>
      <DataTableValues values={isvector(values) || isindex(values) ? values.v : values} decNum={decNum[i]} />
   </tr>
   {/each}
{:else}
   <tr class="datatable__row">
      {#each variables as {label, values}}
      <td class="datatable__label">{@html label}</td>
      {/each}
   </tr>
   {#each Array(variables[0].values.length) as _, j}
   <tr class="datatable__row">
      {#each variables as {_, values}, i}
      <DataTableValues values={[isvector(values) || isindex(values) ? values.v[j] : values[j]]} decNum={decNum[i]} />
      {/each}
   </tr>
   {/each}
{/if}
</table>

<style>
   .datatable {
      margin: 0;
      border-spacing: 0;
      border-collapse: collapse;
   }

   .datatable__label {
      vertical-align: middle;
      padding: 0.25em 0.1em;
      margin: 0;
      border-spacing: 0;
      border-collapse: collapse;
   }

   .datatable__label {
      font-weight: bold;
      vertical-align: middle;
   }
</style>