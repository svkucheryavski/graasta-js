<script>
   /****************************************************
   * ScatterSeries component                           *
   * --------------------                              *
   * shows a series of points on the plot              *
   *                                                   *
   *****************************************************/

   import { range, mrange, rep } from 'mdatools/stat';
   import { getContext } from 'svelte';
   import { Colors } from './Colors';
   import TextLabels from './TextLabels.svelte';

   /*****************************************/
   /* Input parameters                      */
   /*****************************************/

   // input parameters
	export let xValues;
   export let yValues;
   export let zValues = undefined
   export let marker = 1
   export let title = "";
   export let faceColor = "transparent";
   export let borderColor = Colors.PRIMARY;
   export let borderWidth = 1;
   export let markerSize = 1;

   /* constants for internal use */
   const markers = ["●", "◼", "▲", "▼", "⬥", "+", "*", "⨯"];
   let markerSymbol;

   /* sanity check of input parameters */
   if (typeof(marker) !== "number" || marker < 1 || marker > markers.length) {
      throw(`ScatterSeries: parameter 'marker' must be a number from 1 to ${markers.length}."`);
   }

   // sanity check for input parameters
   $: {
      if (!Array.isArray(xValues) || !Array.isArray(yValues)) {
         throw("ScatterSeries: parameters 'xValues' and 'yValues' must be vectors.")
      }

      const n = xValues.length;
      if (yValues.length !== n) {
         throw("ScatterSeries: parameters 'xValues', 'yValues' should have the same length.")
      }

      if (zValues === undefined) {
         zValues = rep(0, n);
      }
   }

   // get axes context and reactive variables needed to compute coordinates
   const axes = getContext('axes');
   $: axes.adjustXAxisLimits(mrange(xValues));
   $: axes.adjustYAxisLimits(mrange(yValues));
   $: axes.adjustZAxisLimits(mrange(zValues));

   // reactive variables for coordinates of data points in pixels (and line style)
   $: markerSymbol = markers[marker - 1];
</script>

<TextLabels
   {xValues} {yValues} {zValues} {faceColor} {borderColor} {borderWidth} {title}
   style="series_scatter"
   labels={markerSymbol}
   textSize={markerSize}
/>

<style>
   :global(.series_scatter > text) {
      font-size: 1em;
      cursor: default;
   }

   :global(.series_scatter > text:hover) {
      opacity: 90%;
   }

   :global(.series_scatter > *:hover + .labels_hover) {
      visibility: visible;
      opacity: 1;
   }
</style>
