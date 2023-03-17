<script>
   export let errormsg = undefined;
   export let legend = "";
</script>

<fieldset class="app-control-block">
   {#if legend !== ""}
   <legend>{legend}</legend>
   {/if}
   <slot></slot>
   {#if errormsg}<div class="app-control-error">{errormsg}</div>{/if}
</fieldset>

<style>
   .app-control-block {
      box-sizing: border-box;
      width: 100%;
      min-width: 200px;
   }

   .app-control-error {
      padding: 0.5em 0.5em 0.25em 0.65em;
      font-size: 0.75em;
      color: crimson;
   }

   fieldset {
      background: #f4f4f4;
      margin: 0;
      box-shadow: 0px 0px 2px  #30303020;
      border: none;
      padding: 0.5em;
   }

   legend {
      color: #606060;
      float: left;
      width: 100%;
      display: block;
      margin: 0;
      padding: 0.25em 0em;
      font-size: 1.0em;
      font-weight: bold;
   }
</style>