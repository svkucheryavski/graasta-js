<script>
   import { fade } from 'svelte/transition';
   import AppControl from "./AppControl.svelte";

   export let id;
   export let label;
   export let options;
   export let value = options[0];
   export let disable = false;
   export let hidden = false;
</script>

<AppControl {id} {label} {disable} {hidden} >

   <div class="selector">
      {#each options as option (option)}
      <div on:click={() => value = option} class="option" class:selected={option==value}>{option}</div>
      {/each}

   </div>
   <input name="{id}" bind:value="{value}">
</AppControl>

<style>
   input {
      display: none;
   }

   .selector {
      position: relative;
      box-sizing: border-box;
      display: inline-block;
      flex: 0 0 auto;
      background: #e0e0e0;

      font-size: 1em;
      height: 1.5em;
      line-height: 1.5em;
      margin: 0;
      padding: 0;
      width: auto;
      border-radius: 2px;

      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;

      display: flex;
   }

   .option {
      cursor: default;
      padding: 0 0.5em;
      margin: 0 1px;
      color: #606060;
      transition: background-color 0.5s ease;
   }

   .option.selected {
      border-radius: 3px;
      background-color: #606060;
      color: #fefefe;
   }

</style>