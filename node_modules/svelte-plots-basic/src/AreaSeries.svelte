<script>

   import { getContext } from 'svelte';
   import { mrange } from 'mdatools/stat';
   import { Colors } from './Colors';

   // input parameters
	export let xValues;
   export let yValues;
   export let title = "";
   export let lineWidth = 1;
   export let lineColor = Colors.PRIMARY;
   export let fillColor = Colors.PRIMARY;
   export let opacity = 1;
   export let lineType = 1;

   /* sanity check of input parameters */
   if (!Array.isArray(xValues) || !Array.isArray(yValues) || xValues.length != yValues.length) {
      throw("AreaSeries: parameters 'xValues' and 'yValues' must be numeric vectors of the same length.");
   }

   // compute ranges for x and y values
   const xValuesRange = mrange(xValues, 0.05);
   const yValuesRange = mrange(yValues, 0.05);

   // get axes context and adjust axes limits
   const axes = getContext('axes');
   axes.adjustXAxisLimits(xValuesRange);
   axes.adjustYAxisLimits(yValuesRange);

   // get reactive variables needed to compute coordinates
   const xLim = axes.xLim;
   const yLim = axes.yLim;
   const axesWidth = axes.width;
   const axesHeight = axes.height;
   const scale = axes.scale;

   // reactive variables for coordinates of data points in pixels
   $: y0 = axes.scaleY([0], $yLim, $axesHeight);
   $: x = axes.scaleX(xValues, $xLim, $axesWidth);
   $: y = axes.scaleY(yValues, $yLim, $axesHeight);
   $: p = x !== undefined && y !== undefined ? x.map((v, i) => `${v},${y[i]}`).join(' ') : undefined;
   $: areaStyleStr = `opacity:${opacity};fill:${fillColor};stroke:${lineColor};stroke-width: ${lineWidth}px;stroke-dasharray:${axes.LINE_STYLES[$scale][lineType - 1]}`;
</script>

{#if p !== undefined}
   <g class="series lineseries" style="{areaStyleStr}" title="{title}">
   <polygon points="{x[0] + "," + y0 + " " + p + " " + x[x.length - 1] + "," + y0[0]}"/>
   </g>
{/if}

<style>
</style>
