<script>
   import { getContext } from 'svelte';
   import { Colors } from './Colors';

   /* input parameters */
	export let left;
   export let top;
   export let width;
   export let height;
   export let labels = undefined;
   export let faceColor = Colors.PRIMARY;
   export let borderColor = faceColor;
   export let lineWidth = 1;

   // styles for bars and labels
   const barsStyleStr = `fill:${faceColor};stroke:${borderColor};stroke-width: ${lineWidth}px;`;

   // multiply width and height values if needed
   if (!Array.isArray(left) || !Array.isArray(top) || left.length < 1 || left.length != top.length) {
      throw("Rectangles: parameters 'left' and 'top' must be vectors of the same size.")
   }

   // we make this reactive in case if left and right has been changed but not width
   const n = left.length;
   if (!Array.isArray(height)) height = Array(n).fill(height);
   if (!Array.isArray(width)) width = Array(n).fill(width);

   /* sanity check for input parameters */
   if (top.length !== n || width.length !== n || height.length !== n) {
      throw("Rectangles: x, y, w and h should have the same length (w and h can be single values).")
   }

   if (labels !== undefined && (!Array.isArray(labels) || labels.length !== n)) {
      throw("Rectangles: vector with labels should have the same length as vectors with x and y coordinates.")
   }

   // get axes context and reactive variables needed to compute coordinates
   const axes = getContext('axes');
   const xLim = axes.xLim;
   const yLim = axes.yLim;
   const axesWidth = axes.width;
   const axesHeight = axes.height;

   // reactive variables for coordinates of data points in pixels
   $: rx = axes.scaleX(left, $xLim, $axesWidth);
   $: ry = axes.scaleY(top, $yLim, $axesHeight);
   $: rw = axes.scaleX(width, $xLim, $axesWidth, true);
   $: rh = axes.scaleY(height, $yLim, $axesHeight, true);
</script>

{#if rx !== undefined && ry !== undefined}
   {#each left as v, i}
      <rect x="{rx[i]}" y="{ry[i]}" width="{rw[i]}" height="{rh[i]}" style="{barsStyleStr}"></rect>
   {/each}
{/if}

<style>
</style>
