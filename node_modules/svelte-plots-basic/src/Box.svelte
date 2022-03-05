<script>
   import { getContext } from 'svelte';
   import { Colors } from './Colors';
   import Rectangles from './Rectangles.svelte';

   /* input parameters */
   export let slot;

   // check that the box is located in a correct slot
   if (slot !== "box") {
      throw("Component Box must have \"slot='box'\" attribute.")
   }

   // get axes context and reactive variables needed to compute coordinates
   const axes = getContext('axes');
   const xLim = axes.xLim;
   const yLim = axes.yLim;
   const isOk = axes.isOk;

   // reactive variables for coordinates of box points in pixels
   $: left = [$xLim[0]];
   $: top = [$yLim[1]];
   $: width = [$xLim[1] - $xLim[0]];
   $: height = [$yLim[1] - $yLim[0]];

</script>

{#if $isOk}
   <g style="pointer-events:none" class="mdaplot__axes-box">
      <Rectangles {left} {top} {width} {height} borderColor="{Colors.DARKGRAY}" faceColor="transparent"></Rectangles>
   </g>
{/if}

<style>
</style>
