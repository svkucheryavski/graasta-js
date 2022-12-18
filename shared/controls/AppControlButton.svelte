<script>
   import AppControl from "./AppControl.svelte";

   export let id;
   export let label;
   export let text;
   export let disable = false;
   export let hidden = false;

</script>

<AppControl id={id} label={label} {disable} {hidden}>
   <button on:click>{text}</button>
</AppControl>

<style>


button {
   height: 1.5em;
   font-size: 1em;
   padding: 0 1em;
   margin: 0;
   color: #606060;
   background: #e0e0e0;
   box-shadow: none;
   border: none;
   border-radius: 3px;
   white-space: nowrap;
   user-select: none;
}

button:hover {
   color: #fafafa;
   background: #606060;
}

</style>