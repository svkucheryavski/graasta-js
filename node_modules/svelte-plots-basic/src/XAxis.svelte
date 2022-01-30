<script>
   import { getContext } from 'svelte';
   import { Colors } from './Colors';

   // input parameters
   export let slot = "xaxis";          // slot the component must be placed in
   export let ticks = undefined;       // vector with numeric tick positions in plot units
   export let tickLabels = ticks;      // vector with labels for each tick
   export let showGrid = false;        // logical, show or not grid lines

   // set up tick mode
   const tickMode = ticks === undefined ? "auto" : "manual";

   /* sanity checks of input parameters */
   if (slot !== "xaxis") {
      throw("Component XAxis must have \"slot='xaxis'\" attribute.")
   }

   if (ticks !== undefined && !Array.isArray(ticks)) {
      throw("XAxis: 'ticks' must be a vector of numbers.")
   }

   if (ticks !== undefined && !(Array.isArray(tickLabels) && tickLabels.length == ticks.length)) {
      throw("XAxis: 'tickLabels' must be a vector of the same size as ticks.")
   }

   /* styles for axis and grid lines */
   const axisLineStyleStr = `stroke:${Colors.DARKGRAY};line-width:1px;`;
   const gridLineStyleStr = `stroke:${Colors.MIDDLEGRAY};stroke-opacity:${showGrid?1:0};stroke-dasharray:2px;`;


   // get axes context and adjust x margins
   const axes = getContext('axes');
   axes.addXAxisMargins();

   // get reactive variables needed to compute coordinates
   const xLim = axes.xLim;
   const yLim = axes.yLim;
   const axesWidth = axes.width;
   const axesHeight = axes.height;
   const scale = axes.scale;
   const isOk = axes.isOk;

   // reactive variables for coordinates of axis lines
   $: x = axes.scaleX($xLim, $xLim, $axesWidth);
   $: y = axes.scaleY($yLim, $yLim, $axesHeight);

   // reactive variables for ticks and their coordinates
   $: dy = $scale === "small" ? 7 : 10;
   $: tickNum = axes.TICK_NUM[$scale];
   $: ticks = tickMode === "auto" ? axes.getAxisTicks(undefined, $xLim, tickNum, true) : ticks;
   $: tickLabels = tickMode === "auto" ? ticks : tickLabels;
   $: ticksX = axes.scaleX(ticks, $xLim, $axesWidth);
   $: ticksY = y === undefined ? undefined : [y[0], y[0] + dy];
</script>

{#if $isOk && x !== undefined && y !== undefined }
   <g class="mdaplot__axis mdaplot__xaxis">
   {#each ticksX as tx, i}
      <line x1="{tx}" x2="{tx}" y1="{y[0]}" y2="{y[1]}" style="{gridLineStyleStr}"></line>
      <line x1="{tx}" x2="{tx}" y1="{ticksY[0]}" y2="{ticksY[1]}" style="{axisLineStyleStr}"></line>
      <text x="{tx}" y="{ticksY[1]}" dx="0" dy="{dy}" class="mdaplot__axis-labels" dominant-baseline="middle" text-anchor="middle">{tickLabels[i]}</text>
   {/each}
   <line x1="{x[0]}" x2="{x[1]}" y1="{y[0]}" y2="{y[0]}"  style="{axisLineStyleStr}"></line>
   </g>
{/if}

<style>
</style>
