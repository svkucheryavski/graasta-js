<script>
   import AppControl from "./AppControl.svelte";

   export let id;
   export let label;
   export let text;
</script>

<AppControl id={id} label={label} >
   <button on:click>{text}</button>
</AppControl>

<style>


button {
   font-size: 0.9em;
   padding: 0.35em 1em;
   margin: 0;
   color: #606060;
   background: #e0e0e0;
   box-shadow: none;
   border: none;
   border-radius: 3px;
   white-space: nowrap;
}

button:hover {
   color: #fafafa;
   background: #606060;
}

</style>