<script>
   import { sum } from 'mdatools/stat';
   import { vector, Vector, Index } from 'mdatools/arrays';
   import { Points } from 'svelte-plots-basic/2d';

   import { colors } from '../../shared/graasta.js';

   export let yPos = 0;
   export let sample = [];
   export let markerSize = 5;
   export let lineColors = colors.plots.SAMPLES;
   export let bgColors = colors.plots.POPULATIONS;

   const borderWidth = 1.5;

   // sample size and coordinates for its elements
   $: n = sample.length;
   $: x = Vector.seq(1, n);
   $: y = vector([yPos]).rep(n);

   // number and coordinates of tails
   $: nT = sum(sample);
   $: iT = Index.bool2ind(sample);
   $: xT = x.subset(iT);
   $: yT = y.subset(iT);

   // number and coordinates of heads
   $: nH = n - nT;
   $: iH = Index.bool2ind(sample.map(v => !v));
   $: xH = x.subset(iH);
   $: yH = y.subset(iH);
</script>

{#if nT > 0}
   <Points xValues={xT} yValues={yT} {markerSize} {borderWidth} faceColor={bgColors[0]} borderColor={lineColors[0]} />
{/if}

{#if nH > 0}
   <Points xValues={xH} yValues={yH} {markerSize} {borderWidth} faceColor={bgColors[1]} borderColor={lineColors[1]} />
{/if}

