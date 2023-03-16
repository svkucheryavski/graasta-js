<script>
   import { vector } from 'mdatools/arrays';
   import { Segments, Points } from 'svelte-plots-basic/3d';

   export let X1Range;
   export let X2Range;
   export let pX1;
   export let pX2;
   export let coeffs;
   export let showLines = 'Both';
   export let color;

   let X1Start, X1End = [];
   let X2Start, X2End = [];

   // generated points at fixed X2Range values
   $: {
      const x1 = pX1;
      const x21 = X2Range[0];
      const x22 = X2Range[1];

      // X1, X2 and y coordinates of start and end points of the line
      X2Start = [x1, x21, vector([1, x1, x21, x1 * x21]).dot(coeffs)];
      X2End = [x1, x22, vector([1, x1, x22, x1 * x22]).dot(coeffs)];
   }

   $: {
      const x11 = X1Range[0];
      const x12 = X1Range[1];
      const x2 = pX2;

      // X1, X2 and y coordinates of start and end points of the line
      X1Start = [x11, x2, vector([1, x11, x2, x11 * x2]).dot(coeffs)];
      X1End = [x12, x2, vector([1, x12, x2, x12 * x2]).dot(coeffs)];
   }

   // generated points at fixed X2Range values
   $: pCoords = [pX1, pX2, vector([1, pX1, pX2, pX1 * pX2]).dot(coeffs)];
</script>

<!-- lines for point X1 and X2 -->
<Points borderColor={"#b0b0b0"} faceColor={"#b0b0b0"} xValues={[pX1]} zValues={[pX2]} yValues={[0]} />

<Segments xStart={[0]} zStart={[pX2]} yStart={[0]} xEnd={[pX1]} zEnd={[pX2]} yEnd={[0]} lineColor="#b0b0b0" />
<Segments xStart={[pX1]} zStart={[0]} yStart={[0]} xEnd={[pX1]} zEnd={[pX2]} yEnd={[0]} lineColor="#b0b0b0" />
<Segments
   xStart={[pX1]} zStart={[pX2]} yStart={[0]}
   xEnd={[pCoords[0]]} zEnd={[pCoords[1]]} yEnd={[pCoords[2]]}
   lineColor="#b0b0b0"
/>


<!-- the point -->
<Points
   faceColor={color} borderColor={color}
   xValues={[pCoords[0]]} zValues={[pCoords[1]]} yValues={[pCoords[2]]}
/>

<!-- lines for point model constant -->
{#if showLines == "X1" || showLines == "Both"}
<Segments
   xStart={[X1Start[0]]} zStart={[X1Start[1]]} yStart={[X1Start[2]]}
   xEnd={[X1End[0]]} zEnd={[X1End[1]]} yEnd={[X1End[2]]}
   lineColor={color}
/>
{/if}

{#if showLines == "X2" || showLines == "Both"}
<Segments
   xStart={[X2Start[0]]} zStart={[X2Start[1]]} yStart={[X2Start[2]]}
   xEnd={[X2End[0]]} zEnd={[X2End[1]]} yEnd={[X2End[2]]}
   lineColor={color}
/>
{/if}


