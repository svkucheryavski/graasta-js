<script>
   import {sum, seq, round, subset, getPValue, dnorm, pnorm} from 'stat-js';

   import TestPlot from "../../shared/plots/TestPlot.svelte";

   export let groups;
   export let sample;
   export let tail;
   export let reset = false;
   export let clicked;

   // sign symbols for hypothesis tails
   const signs = {"both": "=", "left": "≥", "right": "≤"};
   const alpha = 0.05;
   const xLabel = "Possible sample proportion";
   const mainColor = "#6f6666";

   // proportions
   let popProp;
   let sampProp;

   // proportion of current sample
   $: sampProp = round(1 - sum(subset(groups, sample).map(v => v - 1)) / sample.length, 2);
   $: popProp = 1 - sum(groups.map(v => v - 1)) / groups.length;

   // standard error for CI
   $: sd = round(Math.sqrt((1 - sampProp) * sampProp / sample.length), 3);

   // PDF curve for sampling distribution
   $: x = seq(0, 1, 100);
   $: f = dnorm(x, popProp, sd);
   $: pValue = getPValue(pnorm, sampProp, tail, [popProp, sd]);


   // critical values
   $: dp = Math.abs(popProp - sampProp)
   $: crit = tail === "both" ? [popProp - dp, popProp + dp] : [sampProp];
   $: H0LegendStr = `H0: π(<tspan font-weight=bold fill=#ff9900>o</tspan>) ${signs[tail]} ${popProp.toFixed(2)}`;
</script>

{#if sd > 0}
<TestPlot
   {mainColor} {reset} {clicked}
   {x} {f} {tail} {crit} {pValue} {alpha} {xLabel} {H0LegendStr}
   showLegend={true} />
{:else}
<p class="error">Sample has members only from one class — standard error is zero and no way to make test</p>
{/if}

<style>
   .error {
      font-size: 1.2em;
      color:red;
      text-align: center;
      padding: 1em;
   }
</style>