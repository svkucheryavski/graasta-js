<script>
   import { Vector, cbind } from 'mdatools/arrays';
   import { Segments } from 'svelte-plots-basic/3d';

   export let coeffs;
   export let X1Range;
   export let X2Range;
   export let showLines = "Both";
   export let color;

   const n = 20;
   const x0 = Vector.ones(n);

   let X1Start, X1End = [];
   let X2Start, X2End = [];

   // generated points at fixed X2Range values
   $: {
      const x1 = Vector.seq(X1Range[0], X1Range[1], (X1Range[1] - X1Range[0]) / (n - 1));
      const x21 = Vector.fill(X2Range[0], n);
      const x22 = Vector.fill(X2Range[1], n);

      X2Start = [
         x1,
         x21,
         cbind(x0, x1, x21, x1.mult(x21)).dot(coeffs).getcolumn(1)
      ];

      X2End = [
         x1,
         x22,
         cbind(x0, x1, x22, x1.mult(x22)).dot(coeffs).getcolumn(1)
      ];


   }

   $: {
      const x11 = Vector.fill(X1Range[0], n);
      const x12 = Vector.fill(X1Range[1], n);
      const x2 = Vector.seq(X2Range[0], X2Range[1], (X2Range[1] - X2Range[0]) / (n - 1));

      X1Start = [
         x11,
         x2,
         cbind(x0, x11, x2, x11.mult(x2)).dot(coeffs).getcolumn(1)
      ];

      X1End = [
         x12,
         x2,
         cbind(x0, x12, x2, x12.mult(x2)).dot(coeffs).getcolumn(1)
      ];
   }
</script>

<!-- lines for X1 is constant -->
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
