<script>
   // shared components - 3d plot elements
   import Segments from '../../shared/plots3d/Segments.svelte';
   import ScatterSeries from '../../shared/plots3d/ScatterSeries.svelte';

   import { mdot, transpose, vmult } from 'mdatools/matrix';

   export let X1Range;
   export let X2Range;
   export let pX1;
   export let pX2;
   export let coeffs;
   export let showLines = "Both";
   export let color;

   let X1Start, X1End = [];
   let X2Start, X2End = [];

   // generated points at fixed X2Range values
   $: {
      const x1 = [pX1];
      const x21 = [X2Range[0]];
      const x22 = [X2Range[1]];

      // X1, X2 and y coordinates of start and end points of the line
      X2Start = [x1, x21, mdot([[1], x1, x21, vmult(x1, x21)], coeffs)[0]];
      X2End = [x1, x22, mdot([[1], x1, x22, vmult(x1, x22)], coeffs)[0]];
   }

   $: {
      const x11 = [X1Range[0]];
      const x12 = [X1Range[1]];
      const x2 = [pX2];

      // X1, X2 and y coordinates of start and end points of the line
      X1Start = [x11, x2, mdot([[1], x11, x2, vmult(x11, x2)], coeffs)[0]];
      X1End = [x12, x2, mdot([[1], x12, x2, vmult(x12, x2)], coeffs)[0]];
   }

   // generated points at fixed X2Range values
   $: pCoords = [pX1, pX2, mdot(transpose([1, pX1, pX2, pX1 * pX2]), coeffs)[0]];
</script>

<!-- the point -->
<ScatterSeries
   faceColor={color} borderColor={color}
   xValues={[pCoords[0]]} zValues={[pCoords[1]]} yValues={[pCoords[2]]}
/>

<!-- lines for point model constant -->
{#if showLines == "X1" || showLines == "Both"}
<Segments
   xStart={X1Start[0]} zStart={X1Start[1]} yStart={X1Start[2]}
   xEnd={X1End[0]} zEnd={X1End[1]} yEnd={X1End[2]}
   lineColor={color}
/>
{/if}

{#if showLines == "X2" || showLines == "Both"}
<Segments
   xStart={X2Start[0]} zStart={X2Start[1]} yStart={X2Start[2]}
   xEnd={X2End[0]} zEnd={X2End[1]} yEnd={X2End[2]}
   lineColor={color}
/>
{/if}

<!-- lines for point X1 and X2 -->
<ScatterSeries borderColor={"#b0b0b0"} faceColor={"#b0b0b0"} xValues={[pX1]} zValues={[pX2]} yValues={[0]} />

<Segments xStart={[0]} zStart={[pX2]} yStart={[0]} xEnd={[pX1]} zEnd={[pX2]} yEnd={[0]} lineColor="#b0b0b0" />
<Segments xStart={[pX1]} zStart={[0]} yStart={[0]} xEnd={[pX1]} zEnd={[pX2]} yEnd={[0]} lineColor="#b0b0b0" />
<Segments
   xStart={[pX1]} zStart={[pX2]} yStart={[0]}
   xEnd={[pCoords[0]]} zEnd={[pCoords[1]]} yEnd={[pCoords[2]]}
   lineColor="#b0b0b0"
/>

