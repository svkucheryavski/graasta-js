<script>
   import {seq, max, mrange, dt} from 'stat-js';
   import TestPlot from '../../shared/plots/TestPlot.svelte';

   export let testRes;
   export let showLegend = true;
   export let H0LegendStr = "";
   export let xLabel = "";
   export let limX = undefined;
   export let limY = undefined;
   export let mainColor = "#404040";
   export let reset;
   export let clicked;

   // PDF curve for sampling distribution
   $: t = seq(-10, 10, 300)
   $: x = t.map(v => v * testRes.se + testRes.effectExpected);
   $: f = dt(t, testRes.DoF);

   // critical t-value
   $: crit = testRes.tail === "both" ?
      [-Math.abs(testRes.effectObserved), Math.abs(testRes.effectObserved)] : [testRes.effectObserved];
</script>

<TestPlot
   {x} {f} {crit} {showLegend} {mainColor} {xLabel} {H0LegendStr} {limX} {limY} {reset} {clicked}
   pValue={testRes.pValue}
   alpha={testRes.alpha}
   tail={testRes.tail}
>
<slot></slot>
</TestPlot>
