<script>
   import {seq, rep, sum} from "stat-js"
   import {ScatterSeries} from "svelte-plots-basic"

   import { colors } from "../../shared/graasta.js";

   export let yPos = 0;
   export let sample = [];
   export let markerSize = 5;
   export let lineColors = colors.plots.SAMPLES;
   export let bgColors = colors.plots.POPULATIONS;

   const borderWidth = 1.5;

   // sample size and coordinates for its elements
   $: n = sample.length;
   $: x = seq(1, n);
   $: y = rep(yPos, n);

   // number and coordiantes of tails
   $: nT = sum(sample);
   $: xT = x.filter((v, i) => sample[i]);
   $: yT = y.filter((v, i) => sample[i]);

   // number and coordiantes of heads
   $: nH = n - nT;
   $: xH = x.filter((v, i) => !sample[i]);
   $: yH = y.filter((v, i) => !sample[i]);

</script>

{#if nT > 0}
   <ScatterSeries xValues={xT} yValues={yT} {markerSize} {borderWidth} faceColor={bgColors[0]} borderColor={lineColors[0]} />
{/if}

{#if nH > 0}
   <ScatterSeries xValues={xH} yValues={yH} {markerSize} {borderWidth} faceColor={bgColors[1]} borderColor={lineColors[1]} />
{/if}

