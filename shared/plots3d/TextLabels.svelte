<script>
   /****************************************************
   * TextLabels component                              *
   * --------------------                              *
   * shows a series of text labels on the plot         *
   * can be used as basis for marker plot              *
   *****************************************************/

   import { rep } from 'mdatools/stat';
   import { getContext } from 'svelte';
   import { Colors } from './Colors';


   /*****************************************/
   /* Input parameters                      */
   /*****************************************/

   export let title = "";
	export let xValues;
   export let yValues;
   export let zValues = undefined;
   export let labels;

   export let pos = 0;
   export let faceColor = Colors.PRIMARY_TEXT;
   export let borderColor = "transparent";
   export let borderWidth = 0;
   export let textSize = 1;
   export let style = "series_textlabel";

   // text-anchor values depending on position
   const textAnchors = ["middle", "middle", "end", "middle", "start"];

   // sanity check for input parameters
   $: {
      if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length !== yValues.length) {
         throw("TextLabels: parameters 'xValues' and 'yValues' must be vectors of the same length.")
      }

      if (zValues === undefined) {
         zValues = rep(0, xValues.length);
      }
   }

   // multiply label values if needed
   $: {
      const n = xValues.length;
      if (!Array.isArray(labels)) labels = Array(n).fill(labels);

      // workaround for an issue when xValues and yValues are changed in parent app
      // but array of labels is still the same as in the
      if (labels.length != n) labels = rep(labels[0], n);

      // check that the length of labels vector is correct
      if (labels.length !== n) {
         throw("TextLabels: parameter 'labels' must be a single text value or a vector of the same size as 'x' and 'y'.")
      }
   }

   // get axes context and reactive variables needed to compute coordinates
   const axes = getContext('axes');
   const scale = axes.scale;
   const tM = axes.tM;

   // reactive variables for coordinates of data points in pixels
   $: coords = axes.world2pixels([xValues, yValues, zValues], $tM)
   $: x = coords[0];
   $: y = coords[1];

   $: dx = [0,  0, -1,  0,  1][pos] * axes.LABELS_MARGIN[$scale];
   $: dy = [0,  1,  0, -1,  0][pos] * axes.LABELS_MARGIN[$scale];

   // styles for the elements
   $: textStyleStr = `fill:${faceColor};stroke-width:${borderWidth}px;stroke:${borderColor};
      font-size:${textSize}em; text-anchor:${textAnchors[pos]};`;
</script>

{#if x !== undefined && y !== undefined}
<g class="series {style}" data-title={title} style={textStyleStr} >
   {#each x as v, i}
      <text vector-effect="none" data-id={i} x={x[i]} y={y[i]} dx={dx} dy={dy}>{@html labels[i]}</text>
   {/each}
</g>
{/if}

<style>
   text, text > :global(tspan) {
      dominant-baseline: middle;
   }
</style>