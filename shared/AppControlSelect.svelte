<script>
   import AppControl from "./AppControl.svelte";

   export let id;
   export let label;
   export let value;
   export let step;
</script>

<AppControl id={id} label={label} >
   <select name="" id=""></select>
</AppControl>

<style>
   :global(.app-control > input, .app-control > select) {
   font-family:inherit;
   font-size: inherit;
   font-size: 0.9em;
   background: #fff;
   border: solid 1px #e0e0e0;
   padding: 0.25em;
   border-radius: 3px;
}

:global(.app-control > select) {
   -webkit-appearance:none;
   padding-right: 20px;
   background-image: url("data:image/svg+xml;utf8,<svg preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23606060' width='100%' height='100%'><polyline points='50,0, 10,40 90,40'/><polyline points='50,100, 10,60 90,60'/></svg>");
   background-repeat: no-repeat;
   background-position: 95% 50%;
   background-size: 10px 60%;
}

</style>