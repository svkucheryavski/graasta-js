<script>
   /****************************************************
   * TextLabels component                              *
   * --------------------                              *
   * shows a series of text labels on the plot         *
   * can be used as basis for marker plot              *
   *****************************************************/

   import { getContext } from 'svelte';
   import { Colors } from './Colors';

   // input parameters
	export let xValues;
   export let yValues;
   export let labels;
   export let pos = 0;
   export let faceColor = Colors.PRIMARY_TEXT;
   export let borderColor = "transparent";
   export let borderWidth = 0;
   export let textSize = 1;
   export let style = "";
   export let title = "series_text";

   // text-anchor values depending on position
   const textAnchors = ["middle", "middle", "start", "middle", "end"];

   // sanity check for input parameters
   if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length !== yValues.length) {
      throw("TextLabels: parameters 'xValues' and 'yValues' must be vectors of the same length.")
   }

   // multiply label values if needed
   $: {
      const n = xValues.length;
      if (!Array.isArray(labels)) labels = Array(n).fill(labels);

      // workaround for an issue when xValues and yValues are changed in parent app
      // but array of labels is still the same as in the
      if (labels.length != n) labels = Array(n).fill(labels[0]);

      // check that the length of labels vector is correct
      if (labels.length !== n) {
         throw("TextLabels: parameter 'labels' must be a single text value or a vector of the same size as 'x' and 'y'.")
      }
   }

   // get axes context and reactive variables needed to compute coordinates
   const axes = getContext('axes');
   const xLim = axes.xLim;
   const yLim = axes.yLim;
   const axesWidth = axes.width;
   const axesHeight = axes.height;
   const scale = axes.scale;

   // reactive variables for coordinates of data points in pixels
   $: x = axes.scaleX(xValues, $xLim, $axesWidth);
   $: y = axes.scaleY(yValues, $yLim, $axesHeight);
   $: dx = [0, 0, 1, 0, -1][pos] * axes.LABELS_MARGIN[$scale];
   $: dy = [0, 1, 0, -1, 0][pos] * axes.LABELS_MARGIN[$scale];

   // styles for the elements
   $: textStyleStr = `fill:${faceColor};stroke-width:${borderWidth}px;stroke:${borderColor};
      font-size:${textSize}em; text-anchor:${textAnchors[pos]};`;
</script>

{#if x !== undefined && y !== undefined}
   <g class="series {style}" title={title} style={textStyleStr} >
   {#each x as v, i}
      <text data-id={i} x={x[i]} y={y[i]} dx={dx} dy={dy}>{@html labels[i]}</text>
   {/each}
   </g>
{/if}

<style>
   text {
      dominant-baseline: middle;
   }
</style>