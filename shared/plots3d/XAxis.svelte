<script>
   import { mean, rep } from 'mdatools/stat';
   import { getContext } from 'svelte';
   import { Colors } from './Colors';
   import Axis from './Axis.svelte';

   // input parameters
   export let slot = "xaxis";         // slot the component must be placed in
   export let ticks = undefined;      // vector with numeric tick positions in plot units
   export let tickLabels = ticks;     // vector with labels for each tick
   export let showGrid = false;        // logical, show or not grid lines
   export let title = ""              // axis title

   export let lineColor = Colors.DARKGRAY;
   export let gridColor = Colors.MIDDLEGRAY;
   export let textColor = Colors.DARKGRAY;

   // set up tick mode
   const tickMode = ticks === undefined ? "auto" : "manual";

   // sanity checks
   if (slot !== "xaxis") {
      throw("XAxis: this component must have \"slot='xaxis'\" attribute.")
   }

   if (ticks !== undefined && !Array.isArray(ticks)) {
      throw("XAxis: 'ticks' must be a vector of numbers.")
   }

   if (ticks !== undefined && !(Array.isArray(tickLabels) && tickLabels.length == ticks.length)) {
      throw("XAxis: 'tickLabels' must be a vector of the same size as ticks.")
   }

   // get axes context and adjust x margins
   const axes = getContext('axes');

   // get reactive variables needed to compute coordinates
   const xLim = axes.xLim;
   const yLim = axes.yLim;
   const zLim = axes.zLim;
   const scale = axes.scale;
   const isOk = axes.isOk;

   // prepare variables for coordinates
   let titleCoords = [];
   let grid1 = [];
   let grid2 = [];
   let axisLine = [];
   let tickCoords = [];

   // compute tick x-coordinates
   $: if ($isOk) {
      const ticksX = tickMode === "auto" ? axes.getAxisTicks(undefined, $xLim, axes.TICK_NUM[$scale], true) : ticks;
      const tickNum = ticksX.length;

      // compute tick y-coordinates (middle, up and bottom)
      const dY = ($yLim[1] - $yLim[0]) / 100; // 1% of axis size
      const ticksY  = rep($yLim[0], tickNum)
      const ticksY1 = rep($yLim[0] - dY, tickNum)
      const ticksY2 = rep($yLim[0] + dY, tickNum)

      // tick z-coordinates
      const ticksZ  = rep($zLim[0], tickNum)

      // coordinates for the ends of grid
      const gridYEnd = rep($yLim[1], tickNum);
      const gridZEnd = rep($zLim[1], tickNum);

      // tick labels
      tickLabels = tickMode === "auto" ? ticksX : tickLabels;

      // combine all coordinates together
      grid1 = [
         [ticksX, ticksY, ticksZ],
         [ticksX, gridYEnd, ticksZ]
      ];

      grid2 = [
         [ticksX, ticksY, ticksZ],
         [ticksX, ticksY2, gridZEnd]
      ];

      axisLine = [
         [[$xLim[0]], [$yLim[0]], [$zLim[0]]],
         [[$xLim[1]], [$yLim[0]], [$zLim[0]]]
      ]

      tickCoords = [
         [ticksX, ticksY1, ticksZ],
         [ticksX, ticksY2, ticksZ]
      ];

      titleCoords = [
         [$xLim[1]], [ticksY1[0] - 0.05 * ($yLim[1] - $yLim[0])], [$zLim[0]]
      ];
   }
</script>

{#if $isOk && axisLine.length > 0}
<Axis
   style="mdaplot__xaxis" pos={1}
   {title} {lineColor} {gridColor} {textColor} {titleCoords}
   {showGrid} {grid1} {grid2} {axisLine} {tickCoords} {tickLabels}
/>
{/if}

