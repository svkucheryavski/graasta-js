<script>
   import { getContext } from 'svelte';
   import { Colors } from './Colors';

   // input parameters
   export let slot = "yaxis";          // slot the component must be placed in
   export let ticks = undefined;       // vector with numeric tick positions in plot units
   export let tickLabels = ticks;      // vector with labels for each tick
   export let showGrid = false;        // logical, show or not grid lines
   export let las = 1;

   // set up tick mode
   const tickMode = ticks === undefined ? "auto" : "manual";

   // TODO: set up tick text translation
   const transform = las > 1 ? "" : "";

   /* sanity checks of input parameters */
   if (slot !== "yaxis") {
      throw("Component YAxis must have \"slot='yaxis'\" attribute.")
   }

   if (ticks !== undefined && !Array.isArray(ticks)) {
      throw("YAxis: 'ticks' must be a vector of numbers.")
   }

   if (ticks !== undefined && !(Array.isArray(tickLabels) && tickLabels.length == ticks.length)) {
      throw("YAxis: 'tickLabels' must be a vector of the same size as ticks.")
   }

   /* styles for axis and grid lines */
   const axisLineStyleStr = `stroke:${Colors.DARKGRAY};line-width:1px;`;
   const gridLineStyleStr = `stroke:${Colors.MIDDLEGRAY};stroke-opacity:${showGrid?1:0};stroke-dasharray:2px;`;


   // get axes context and adjust x margins
   const axes = getContext('axes');
   axes.addYAxisMargins();

   // get reactive variables needed to compute coordinates
   const xLim = axes.xLim;
   const yLim = axes.yLim;
   const axesWidth = axes.width;
   const axesHeight = axes.height;
   const scale = axes.scale;

   // reactive variables for coordinates of axis lines
   $: x = axes.scaleX($xLim, $xLim, $axesWidth);
   $: y = axes.scaleY($yLim, $yLim, $axesHeight);

   // reactive variables for ticks and their coordinates
   $: dx = $scale === "small" ? -4 : -6;
   $: tickNum = axes.TICK_NUM[$scale];
   $: ticks = tickMode === "auto" ? axes.getAxisTicks(undefined, $yLim, tickNum, true) : ticks;
   $: tickLabels = tickMode === "auto" ? ticks : tickLabels;
   $: ticksY = axes.scaleY(ticks, $yLim, $axesHeight);
   $: ticksX = x === undefined ? undefined : [x[0] + dx, x[0]];
</script>

{#if x !== undefined && y !== undefined }
   <g class="mdaplot__axis mdaplot__yaxis">
   {#each ticksY as ty, i}
      <line x1="{x[0]}" x2="{x[1]}" y1="{ty}" y2="{ty}" style="{gridLineStyleStr}"></line>
      <line x1="{ticksX[0]}" x2="{ticksX[1]}" y1="{ty}" y2="{ty}" style="{axisLineStyleStr}" ></line>
      <text x="{ticksX[0]}" y="{ty}" dx="{dx}" dy="{0}" {transform} style="background:red" class="mdaplot__axis-labels" dominant-baseline="middle" text-anchor="end">{tickLabels[i]}</text>
   {/each}
   <line x1="{x[0]}" x2="{x[0]}" y1="{y[0]}" y2="{y[1]}" style="{axisLineStyleStr}" ></line>
   </g>
{/if}

<style>
</style>
