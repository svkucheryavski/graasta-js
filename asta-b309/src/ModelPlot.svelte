<script>
   import {rep, seq} from 'mdatools/stat';
   import { mdot } from 'mdatools/matrix';

   import Segments from '../../shared/plots3d/Segments.svelte';

   export let coeffs;
   export let X1Range;
   export let X2Range;
   export let color;

   const n = 20;
   const x0 = rep(1, n);

   let X1Start, X1End = [];
   let X2Start, X2End = [];

   // generated points at fixed X2Range values
   $: {
      const x1 = seq(X1Range[0], X1Range[1], n);
      const x21 = rep(X2Range[0], n);
      const x22 = rep(X2Range[1], n);

      X2Start = [x1, x21, mdot([x0, x1, x21], coeffs)[0]];
      X2End = [x1, x22, mdot([x0, x1, x22], coeffs)[0]];
   }

   $: {
      const x11 = rep(X1Range[0], n);
      const x12 = rep(X1Range[1], n);
      const x2 = seq(X2Range[0], X2Range[1], n);

      X1Start = [x11, x2, mdot([x0, x11, x2], coeffs)[0]];
      X1End = [x12, x2, mdot([x0, x12, x2], coeffs)[0]];
   }
</script>

<Segments
   xStart={X1Start[0]} zStart={X1Start[1]} yStart={X1Start[2]}
   xEnd={X1End[0]} zEnd={X1End[1]} yEnd={X1End[2]}
   lineColor={color}
/>

<Segments
   xStart={X2Start[0]} zStart={X2Start[1]} yStart={X2Start[2]}
   xEnd={X2End[0]} zEnd={X2End[1]} yEnd={X2End[2]}
   lineColor={color}
/>
