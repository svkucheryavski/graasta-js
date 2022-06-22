<script>
   export let id;
   export let label;
   export let disable = false;
   export let hidden = false;
</script>

<div class="app-control" class:hidden class:disable>
   <div class="shield"></div>
   <label for={id}>{@html label}</label>
   <slot></slot>
</div>

<style>
   .app-control {
      font-size: 1em;
      margin: 0.25em 0 0 0;
      padding: 0.15em 0.25em;
      display: flex;
      align-items: center;
      justify-content: flex-begin;
      position: relative;
   }


   .app-control > label {
      height: 1.5em;
      line-height: 1.5em;
      flex: 0 0 90px;
      max-width: 90px;
   }

   .app-control > slot {
      width: 100%;
   }

   .shield {
      display: none;
   }

   @media(min-width: 959px) {
      .app-control > label {
         flex: 0 0 120px;
         max-width: 120px;
      }
   }

   @media(min-width: 1279px) {
      .app-control > label {
         flex: 0 0 150px;
         max-width: 150px;
      }
   }

   /* disabled styles */
   .app-control.disable > label{
      color: #b0b0b0;
   }

   .app-control.hidden {
      visibility: hidden;
   }

   .app-control.disable > .shield {
      display: block;
      background: #ffffff50;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999;
   }
</style>