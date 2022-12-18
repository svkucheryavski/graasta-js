<script>
   /****************************************************
   * TextLabels component                              *
   * --------------------                              *
   * shows a series of text labels on the plot         *
   * can be used as basis for marker plot              *
   *****************************************************/

   import { getContext } from 'svelte';
   import { Colors } from './Colors';
   import { subset } from 'mdatools/stat';
   import { vmult } from 'mdatools/matrix';

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


   // function to prepare values for variables 'label' and 'pos'
   function processValues(v, n, name) {
      if (!Array.isArray(v)) return Array(n).fill(v);
      if (v.length !== n) {
         throw(`TextLabels: parameter ${name} must be a single number or a vector of the same size as 'x' and 'y'.`)
      }
      return v;
   }

   // sanity check for input parameters
   if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length !== yValues.length) {
      throw("TextLabels: parameters 'xValues' and 'yValues' must be vectors of the same length.")
   }

   // prepare values for labels and positions
   $: labelsLocal = processValues(labels, xValues.length);
   $: posLocal = pos === 0 ? pos : processValues(pos, xValues.length);

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
   $: dx = pos === 0 ? 0 : subset(vmult([0, 1, 0, -1], axes.LABELS_MARGIN[$scale]), posLocal)
   $: dy = pos === 0 ? 0 : subset(vmult([1, 0, -1, 0], axes.LABELS_MARGIN[$scale]), posLocal)
   $: textAnchors = pos === 0 ? "middle" : subset([ "middle", "start", "middle", "end"], posLocal);

   // styles for the elements
   $: textStyleStr = `dominant-baseline:middle;fill:${faceColor};stroke-width:${borderWidth}px;stroke:${borderColor};
      font-size:${textSize}em; text-anchor:middle;`;
</script>

{#if x !== undefined && y !== undefined}
   <g class="series {style}" title={title} style={textStyleStr} >

   {#if pos === 0}
   {#each x as v, i}
      <text data-id={i} x={x[i]} y={y[i]}>{@html labelsLocal[i]}</text>
   {/each}

   {:else}
   {#each x as v, i}
      <text data-id={i} x={x[i]} y={y[i]} dx={dx[i]} dy={dy[i]} text-anchor={textAnchors[i]}>{@html labelsLocal[i]}</text>
   {/each}
   {/if}

   </g>
{/if}

<style>
   text, text > :global(tspan) {
      cursor: default;
      user-select: none;
      dominant-baseline: middle;
   }
</style>