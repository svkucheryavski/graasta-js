<script>
   import { getContext } from 'svelte';
   import { Colors } from './Colors';
   import { max, mrange, diff } from 'mdatools/stat';
   import Rectangles from './Rectangles.svelte';

   /* input parameters */
	export let xValues;
   export let yValues;
   export let barWidth = 0.8;
   export let title = "";
   export let faceColor = Colors.PRIMARY;
   export let borderColor = Colors.PRIMARY;
   export let showLabels = "no"; // can be "no", "hover", "always"

   // TODO: implemented later
   //export let labels = yValues;

   /* internal parameters */
   let width;
   let left;
   let top;
   let height;

   // to access shared parameters and methods from Axes
   const axes = getContext('axes');

   /* reactive actions related to x-values, fires when there are changes in:
    * - xValues
    * - barWidth
    */
   $: {

      if (!Array.isArray(xValues)) {
         throw("BarSeries: parameter 'xValues' must be a numeric vector.");
      }

      if (barWidth <= 0 || barWidth > 1) {
         throw("BarSeries: parameters 'barWidth' should be between 0 and 1.");
      }

      const xValuesRange = mrange(xValues, 0.1);
      xValuesRange[0] = xValuesRange[0] - barWidth * diff(xValuesRange) / xValues.length * 0.5
      xValuesRange[1] = xValuesRange[1] + barWidth * diff(xValuesRange) / xValues.length * 0.5
      axes.adjustXAxisLimits(xValuesRange);

      width = Array(xValues.length).fill(max(diff(xValues)) * barWidth);
      left = xValues.map((v, i) => v - width[i]/2);
   }

   /* reactive actions related to y-values, fires when there are changes in:
    * - yValues
    */
   $: {

      if (!Array.isArray(yValues) || xValues.length != yValues.length) {
         throw("BarSeries: parameter 'yValues' must be a numeric vector of the same length as 'xValues'.");
      }

      const yValuesRange = mrange(yValues, showLabels === "no" ? 0.05 : 0.20);
      axes.adjustYAxisLimits(yValuesRange);

      top = yValues.map(v => v > 0 ? v : 0);
      height = yValues.map(v => Math.abs(v));
   }
</script>

<Rectangles style="series_bar" {left} {top} {width} {height} {borderColor} {faceColor} {title} />
