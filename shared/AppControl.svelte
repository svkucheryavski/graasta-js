<script>
   export let id;
   export let label;
</script>

<div class="app-control">
   <label for="{id}">{label}</label>
   <slot></slot>
</div>

<style>
   .app-control {
      font-size: 1em;
      margin: 0.25em 0 0 0;
      padding: 0.25em 0.5em;
      display: flex;
      align-items: center;
      justify-content: flex-begin;
   }

   .app-control > label {
      flex: 0 0 120px;
      max-width: 120px;
   }

   .app-control > slot {
      width: 100%;
   }

   @media(min-width: 800px) {
      .app-control > label {
         flex: 0 0 150px;
         max-width: 150px;
      }
   }

</style>