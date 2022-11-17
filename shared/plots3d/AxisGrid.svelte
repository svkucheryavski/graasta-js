<script>
   /****************************************************
   * Axis grid                                         *
   * --------------------                              *
   * shows a grid for axis                             *
   *                                                   *
   *****************************************************/

   import { getContext } from 'svelte';
   import { Colors } from './Colors';


   /*****************************************/
   /* Input parameters                      */
   /*****************************************/

   export let gridCoords = [];
   export let lineColor = Colors.MIDDLEGRAY;
   export let lineType = 1;
   export let lineWidth = 1;

   // get axes context and reactive variables needed to compute coordinates
   const axes = getContext('axes');
   const scale = axes.scale;
   const tM = axes.tM;

   let x1, x2, y1, y2, lineStyleStr = undefined;
   $: if (gridCoords.length == 2) {
      const coords1 = axes.world2pixels(gridCoords[0], $tM)
      const coords2 = axes.world2pixels(gridCoords[1], $tM)
      x1 = coords1[0];
      x2 = coords2[0];
      y1 = coords1[1];
      y2 = coords2[1];
   }

   lineStyleStr = `stroke:${lineColor};stroke-width: ${lineWidth}px;stroke-dasharray:${axes.LINE_STYLES[$scale][lineType - 1]}`;
</script>

{#if x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined}
<g class="axis__grid">
   {#each x1 as v, i}
   <line vector-effect="non-scaling-stroke" x1={x1[i]} x2={x2[i]} y1={y1[i]} y2={y2[i]} style={lineStyleStr} />
   {/each}
</g>
{/if}

