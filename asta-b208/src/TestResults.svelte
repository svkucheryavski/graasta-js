<script>
   import {pt, tTest1, seq, max, dt, qt} from 'stat-js';
   import {LineSeries, TextLegend, Segments} from 'svelte-plots-basic';

   // shared components
   import { formatLabels } from "../../shared/graasta.js";
   import TTestPlot from "../../shared/plots/TTestPlot.svelte";

   export let popMean;
   export let popH0Mean;
   export let popSD;
   export let sample;
   export let tail;
   export let colorsPop;
   export let reset;
   export let clicked;

   // constant parameters
   const signs = {"both": "=", "left": "≥", "right": "≤"};
   const alpha = 0.05;
   const mainColor = "#a0a0a0";
   const xLabel = "Expected sample mean, m";
   const limX = [85, 115];

   // run t-test
   $: testRes = tTest1(sample, popH0Mean, 0.05, tail)

   // statistics for current sample
   $: sampSize = sample.length;
   $: popSE = popSD / Math.sqrt(sampSize);

   // PDF curve for sampling distribution (real)
   $: t = seq(-10, 10, 300);
   $: xr = t.map(v => v * popSE + popMean);
   $: fr = dt(t, sampSize - 1);

   // power of test and corresponding PDF
   $: tCrit = qt(tail === "left" ? alpha : 1 - alpha, sampSize - 1);
   $: critMean = popH0Mean + tCrit * popSE;
   $: power = tail === "right" ? 1 - pt(critMean - popMean, sampSize - 1) : pt((critMean - popMean) / popSE, sampSize - 1);

   // string for H0 hypothesis
   $: H0LegendStr = `H0: µ ${signs[tail]} ${popH0Mean.toFixed(1)}`;
</script>

<TTestPlot {mainColor} {clicked} {reset} {testRes} {H0LegendStr} {limX} {xLabel} >
   <LineSeries xValues={xr} yValues={fr} lineColor={colorsPop.sample + "a0"} />
   <Segments xStart={[testRes.effectObserved]} xEnd={[testRes.effectObserved]}
      yStart={[0]} yEnd={[max(fr)]} lineColor={colorsPop.sample} lineType={2} />
   <TextLegend textSize={1.15} top={max(fr) * 1.05} dx="1.5em" dy="2.7em" left={85}
      elements={formatLabels([{name: "power", value: power.toFixed(3)}])} />
</TTestPlot>

