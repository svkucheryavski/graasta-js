<script>
   import {seq, sd, dt, mean, pt, range, max} from 'stat-js';
   import TestPlot from '../../shared/plots/TestPlot.svelte';

   export let testRes;
   export let showLegend = true;
   export let H0LegendStr = "";
   export let xLabel = "";
   export let limX = undefined;
   export let limY = undefined;

   export let lineColor = "#404040";
   export let areaColor = lineColor + "40";
   export let statColor = "#000000";

   // PDF curve for sampling distribution
   $: x = seq(testRes.effectExpected - 10 * testRes.se, testRes.effectExpected + 10 * testRes.se, 300);
   $: f = dt(x.map(v => v / testRes.se), testRes.DoF);

   // critical t-value
   $: crit = testRes.tail === "both" ? [-Math.abs(testRes.effectObserved), Math.abs(testRes.effectObserved)] : [testRes.effectObserved];

</script>

<TestPlot
   {x} {f} {crit} {showLegend} {lineColor} {areaColor} {statColor} {xLabel} {H0LegendStr}
   pValue={testRes.pValue}
   alpha={testRes.alpha}
   limX={limX}
   limY={limY}
   tail="both"
/>