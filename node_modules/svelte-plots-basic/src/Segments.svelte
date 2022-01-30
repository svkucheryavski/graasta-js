<script>
   import { getContext } from 'svelte';
   import { Colors } from './Colors';

   /* input parameters */
	export let xStart;
   export let xEnd;
   export let yStart;
   export let yEnd;
   export let lineColor = Colors.PRIMARY;
   export let lineType = 1;
   export let lineWidth = 1;

   /* sanity check for input parameters */
   if (!Array.isArray(xStart) || !Array.isArray(xEnd) || !Array.isArray(yStart) || !Array.isArray(yEnd)) {
      throw("Segments: parameters 'xStart', 'yStart', 'xEnd' and 'yEnd' must be vectors.")
   }

   const n = xStart.length;
   if (xEnd.length !== n || yStart.length !== n || yEnd.length !== n) {
      throw("Segments: parameters 'xStart', 'yStart', 'xEnd' and 'yEnd' should have the same length.")
   }

   // get axes context and reactive variables needed to compute coordinates
   const axes = getContext('axes');
   const xLim = axes.xLim;
   const yLim = axes.yLim;
   const axesWidth = axes.width;
   const axesHeight = axes.height;
   const scale = axes.scale;

   // reactive variables for coordinates of data points in pixels (and line style)
   $: x1 = axes.scaleX(xStart, $xLim, $axesWidth);
   $: x2 = axes.scaleX(xEnd, $xLim, $axesWidth);
   $: y1 = axes.scaleY(yStart, $yLim, $axesHeight);
   $: y2 = axes.scaleY(yEnd, $yLim, $axesHeight);
   $: lineStyleStr = `stroke:${lineColor};stroke-width: ${lineWidth}px;stroke-dasharray:${axes.LINE_STYLES[$scale][lineType - 1]}`;

</script>

{#if x1 !== undefined && y1 !== undefined}
   {#each x1 as v, i}
      <line x1="{x1[i]}" x2="{x2[i]}" y1="{y1[i]}" y2="{y2[i]}" style="{lineStyleStr}"></line>
   {/each}
{/if}

<style>
</style>
