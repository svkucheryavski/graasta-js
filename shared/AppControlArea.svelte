<script>
   export let errormsg = undefined;
</script>

<fieldset>
   <slot></slot>
   {#if errormsg}<div class="app-control-error">{errormsg}</div>{/if}
</fieldset>

<style>
   .app-control-error {
      padding: 0.5em 0.5em 0.25em 0.65em;
      font-size: 0.75em;
      color: crimson;
   }

   fieldset {
      background: #f4f4f4;
      margin: 0;
      padding: 0.5em;
      box-shadow: 0px 0px 2px  #30303020;
      border: none;
   }
</style>