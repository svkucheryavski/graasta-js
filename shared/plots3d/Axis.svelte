<script>
   import { Colors } from './Colors';
   import AxisLines from './AxisLines.svelte';
   import TextLabels from './TextLabels.svelte';

   // input parameters
   export let tickLabels = [];     // vector with labels for each tick
   export let showGrid = false;        // logical, show or not grid lines
   export let title = ""              // axis title

   export let pos = 1;
   export let style = "";
   export let grid1 = [];
   export let grid2 = [];
   export let axisLine = [];
   export let tickCoords = [];
   export let titleCoords = [];

   export let lineColor = Colors.DARKGRAY;
   export let gridColor = Colors.MIDDLEGRAY;
   export let textColor = Colors.DARKGRAY;


</script>

<g class="mdaplot__axis {style}">

   <!-- grid -->
   {#if showGrid }
      <AxisLines lineCoords={grid1} lineColor={gridColor} lineType={3} />
      <AxisLines lineCoords={grid2} lineColor={gridColor} lineType={3} />
   {/if}

   <!-- main axis line -->
   <AxisLines lineCoords={axisLine} lineColor={lineColor} lineType={1} />

   <!-- ticks-->
   <AxisLines lineCoords={tickCoords} lineColor={lineColor} lineType={1} />

   <!-- labels -->
   {#if tickCoords.length === 2 && tickLabels.length === tickCoords[1][0].length}
   <TextLabels
      xValues={tickCoords[0][0]} yValues={tickCoords[0][1]} zValues={tickCoords[0][2]}
      faceColor={textColor}
      labels={tickLabels} {pos}
   />
   {/if}

   <!-- title -->
   {#if titleCoords.length === 3 && title !== ""}
   <TextLabels
      xValues={titleCoords[0]} yValues={titleCoords[1]} zValues={titleCoords[2]}
      faceColor={textColor}
      labels={title} {pos}
   />
   {/if}
</g>

