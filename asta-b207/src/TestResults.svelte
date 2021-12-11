<script>
   import {pt, round, seq, sd, getPValue, dt, mean} from 'stat-js';
   import TestPlot from "../../shared/plots/TestPlot.svelte";

   export let popMean;
   export let popSD;
   export let sample;
   export let reset;
   export let tail;
   export let clicked;

   // sign symbols for hypothesis tails
   const signs = {"both": "=", "left": "≥", "right": "≤"};
   const alpha = 0.05;
   const xLabel = "Possible sample mean";
   const mainColor = "#6f6666";

   // statistics for current sample
   $: sampSize = sample.length;
   $: sampMean = round(mean(sample), 2);
   $: sampSD = round(sd(sample), 2);
   $: SE = sampSD / Math.sqrt(sampSize);
   $: tValue = (sampMean - popMean) / SE;

   $: limX = [popMean - 3 * popSD, popMean + 3 * popSD];

   // PDF curve for sampling distribution
   $: t = seq(-10, 10, 300)
   $: x = t.map(v => v * SE + popMean);
   $: f = dt(t, sampSize - 1);

   // this p-value is always for left half of the PDF and has to be adjusted
   $: pValue = getPValue(pt, tValue, tail, [sampSize - 1]);

   $: dp = Math.abs(popMean - sampMean)
   $: crit = tail === "both" ? [popMean - dp, popMean + dp] : [sampMean];

   $: H0LegendStr = `H0: µ ${signs[tail]} ${popMean.toFixed(1)}`;
</script>

<TestPlot {mainColor} {reset} {clicked} {xLabel} {limX} {x} {f} {tail} {crit} {pValue} {alpha} {H0LegendStr} showLegend={true} />
