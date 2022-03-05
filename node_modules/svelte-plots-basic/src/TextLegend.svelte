<script>
   import { getContext } from 'svelte';
   import { Colors } from './Colors';

   /* input parameters */
	export let left;
   export let top;
   export let dx = "0";
   export let dy = "1.25em";
   export let elements;
   export let faceColor = Colors.PRIMARY_TEXT;
   export let borderColor = "transparent";
   export let borderWidth = 0;
   export let textSize = 1;

   // get axes context and reactive variables needed to compute coordinates
   const axes = getContext('axes');
   const xLim = axes.xLim;
   const yLim = axes.yLim;
   const axesWidth = axes.width;
   const axesHeight = axes.height;
   const scale = axes.scale;

   // reactive variables for coordinates of data points in pixels
   $: x = axes.scaleX([left], $xLim, $axesWidth);
   $: y = axes.scaleY([top], $yLim, $axesHeight);

   // styles for bars and labels
   $: textStyleStr = `fill:${faceColor};stroke-width:${borderWidth}px;stroke:${borderColor};font-size:${textSize}em;`;
</script>

{#if x !== undefined && y !== undefined && elements.length > 0}
   <text style={textStyleStr} x={x} y={y} dx={dx} dy={dy} dominant-baseline="middle" text-anchor="start">
      {#each elements as el, i}
         <tspan {x} {dx} dy={i === 0 ? 0 : dy}>{@html el}</tspan>
      {/each}
   </text>
{/if}