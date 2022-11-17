<script>
   /****************************************************
   * Segments component                                *
   * --------------------                              *
   * shows a series of line segments on the plot       *
   *                                                   *
   *****************************************************/

   import { mrange, rep } from 'mdatools/stat';
   import { getContext } from 'svelte';
   import { Colors } from './Colors';


   /*****************************************/
   /* Input parameters                      */
   /*****************************************/

   export let title = "";
	export let xStart;
   export let xEnd;
   export let yStart;
   export let yEnd;
   export let zStart = undefined;
   export let zEnd = undefined;

   export let lineColor = Colors.PRIMARY;
   export let lineType = 1;
   export let lineWidth = 1;

   // sanity check for input parameters
   $: {
      if (!Array.isArray(xStart) || !Array.isArray(xEnd) || !Array.isArray(yStart) || !Array.isArray(yEnd)) {
         throw("Segments: parameters 'xStart', 'yStart', 'xEnd' and 'yEnd' must be vectors.")
      }

      const n = xStart.length;
      if (xEnd.length !== n || yStart.length !== n || yEnd.length !== n) {
         throw("Segments: parameters 'xStart', 'yStart', 'xEnd' and 'yEnd' should have the same length.")
      }

      if (zStart === undefined) {
         zStart = rep(0, n);
      }

      if (zEnd === undefined) {
         zEnd = zStart;
      }
   }

   // get axes context and reactive variables needed to compute coordinates
   const axes = getContext('axes');
   const scale = axes.scale;
   const tM = axes.tM;

   $: axes.adjustXAxisLimits(mrange(xStart.concat(xEnd)));
   $: axes.adjustYAxisLimits(mrange(yStart.concat(yEnd)));
   $: axes.adjustZAxisLimits(mrange(zStart.concat(zEnd)));

   // reactive variables for coordinates of data points in pixels (and line style)
   $: coords1 = axes.world2pixels([xStart, yStart, zStart], $tM)
   $: coords2 = axes.world2pixels([xEnd, yEnd, zEnd], $tM)
   $: x1 = coords1[0];
   $: x2 = coords2[0];
   $: y1 = coords1[1];
   $: y2 = coords2[1];
   $: lineStyleStr = `stroke:${lineColor};stroke-width: ${lineWidth}px;stroke-dasharray:${axes.LINE_STYLES[$scale][lineType - 1]}`;
</script>

<g class="series series_segment" data-title="{title}">
{#if x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined}
   {#each x1 as v, i}
      <line vector-effect="non-scaling-stroke" x1={x1[i]} x2={x2[i]} y1={y1[i]} y2={y2[i]} style={lineStyleStr} />
   {/each}
{/if}
</g>

