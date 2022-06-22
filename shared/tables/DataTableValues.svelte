<script>
   export let values;
   export let decNum;
</script>

{#if decNum >= 0}
   {#each values as value}
   <td class="datatable__value datatable__value_number">{isNaN(value) ? "" : value.toFixed(decNum)}</td>
   {/each}
{:else}
   {#each values as value}
   <td class="datatable__value datatable__value_text">{@html value}</td>
   {/each}
{/if}

<style>

   .datatable__value {
      vertical-align: middle;
      padding: 0.25em 0.1em;
      margin: 0;
      border-spacing: 0;
      border-collapse: collapse;
   }

   .datatable__value_number {
      text-align: right;
   }
</style>