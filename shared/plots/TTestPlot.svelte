<script>
   import {seq, dt} from "stat-js";
   import TestPlot from "../../shared/plots/TestPlot.svelte";

   export let testRes;
   export let showLegend = true;
   export let H0LegendStr = "";
   export let xLabel = "";
   export let limX = undefined;
   export let limY = undefined;
   export let mainColor = "#808080";
   export let reset;
   export let clicked;

   const signs = {"both": "=", "left": "≥", "right": "≤"};

   // PDF curve for sampling distribution
   $: t = seq(-10, 10, 300)
   $: x = t.map(v => v * testRes.se + testRes.effectExpected);
   $: f = dt(t, testRes.DoF);

   // critical values
   $: dp = Math.abs(testRes.effectObserved - testRes.effectExpected)
   $: crit = testRes.tail === "both" ? [testRes.effectExpected - dp, testRes.effectExpected + dp] : [testRes.effectObserved];

   $: H0LegendStr = testRes.test === "Two sample t-test" ?
      `H0: µ1 – µ2 = 0` :
      `H0: µ ${signs[testRes.tail]} ${testRes.effectExpected.toFixed(2)}`;
</script>

<TestPlot
   {x} {f} {crit} {showLegend} {mainColor} {xLabel} {H0LegendStr} {limX} {limY} {reset} {clicked}
   pValue={testRes.pValue}
   alpha={testRes.alpha}
   tail={testRes.tail}
>
<slot></slot>
</TestPlot>
