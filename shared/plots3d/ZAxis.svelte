<script>
   import { rep } from 'mdatools/stat';
   import { getContext } from 'svelte';
   import { Colors } from './Colors';
   import Axis from './Axis.svelte';

   // input parameters
   export let slot = "zaxis";         // slot the component must be placed in
   export let ticks = undefined;      // vector with numeric tick positions in plot units
   export let tickLabels = ticks;     // vector with labels for each tick
   export let showGrid = false;       // logical, show or not grid lines
   export let title = ""              // axis title

   export let lineColor = Colors.DARKGRAY;
   export let gridColor = Colors.MIDDLEGRAY;
   export let textColor = Colors.DARKGRAY;

   // set up tick mode
   const tickMode = ticks === undefined ? "auto" : "manual";

   // sanity checks
   if (slot !== "zaxis") {
      throw("ZAxis: this component must have \"slot='zaxis'\" attribute.")
   }

   if (ticks !== undefined && !Array.isArray(ticks)) {
      throw("ZAxis: 'ticks' must be a vector of numbers.")
   }

   if (ticks !== undefined && !(Array.isArray(tickLabels) && tickLabels.length == ticks.length)) {
      throw("ZAxis: 'tickLabels' must be a vector of the same size as ticks.")
   }

   // get axes context
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
   if ($isOk) {
      const ticksZ = tickMode === "auto" ? axes.getAxisTicks(undefined, $zLim, axes.TICK_NUM[$scale], true) : ticks;
      const tickNum = ticksZ.length;

      // compute tick y-coordinates (middle, up and bottom)
      const dX = ($xLim[1] - $xLim[0]) / 100; // 1% of axis size
      const ticksX  = rep($xLim[0], tickNum)
      const ticksX1 = rep($xLim[0] - dX, tickNum)
      const ticksX2 = rep($xLim[0] + dX, tickNum)

      // tick z-coordinates
      const ticksY  = rep($yLim[0], tickNum)

      // coordinates for the ends of grid
      const gridXEnd = rep($xLim[1], tickNum);
      const gridYEnd = rep($yLim[1], tickNum);

      // tick labels
      tickLabels = tickMode === "auto" ? ticksZ : tickLabels;

      // combine all coordinates together

      grid1 = [
         [ticksX, ticksY, ticksZ],
         [gridXEnd, ticksY, ticksZ]
      ];

      grid2 = [
         [ticksX, ticksY, ticksZ],
         [ticksX, gridYEnd, ticksZ]
      ];

      axisLine = [
         [[$xLim[0]], [$yLim[0]], [$zLim[0]]],
         [[$xLim[0]], [$yLim[0]], [$zLim[1]]]
      ]

      tickCoords = [
         [ticksX1, ticksY, ticksZ],
         [ticksX2, ticksY, ticksZ]
      ];


      titleCoords = [
         [ticksX1[0] - 0.05 * ($xLim[1] - $xLim[0])], [$yLim[0]], [$zLim[1]]
      ];

   }
</script>

{#if $isOk && axisLine.length > 0}
<Axis
   style="mdaplot__yaxis" pos = {2}
   {title} {lineColor} {gridColor} {textColor} {titleCoords}
   {showGrid} {grid1} {grid2} {axisLine} {tickCoords} {tickLabels}
/>
{/if}

