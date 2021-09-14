<script>
   export let errormsg;
</script>

<fieldset>
   <slot></slot>
   <div class="app-control-error">{errormsg}</div>
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
      padding: 0;
      box-shadow: 0px 0px 5px  #30303020;
      border: none;
   }
</style>