<script>
   import { sum } from 'mdatools/stat';
   import { Vector } from 'mdatools/arrays';
   import { getpvalue } from 'mdatools/tests';
   import { dnorm, pnorm } from 'mdatools/distributions';

   import TestPlot from '../../shared/plots/TestPlot.svelte';

   export let groups;
   export let sample;
   export let tail;
   export let reset = false;
   export let clicked;

   // sign symbols for hypothesis tails
   const signs = {'both': '=', 'left': '≥', 'right': '≤'};
   const alpha = 0.05;
   const xLabel = 'Possible sample proportion';
   const mainColor = '#6f6666';

   // proportions
   let popProp;
   let sampProp;

   // proportion of current sample
   $: sampProp = 1 - sum(groups.subset(sample)) / sample.length;
   $: popProp = 1 - sum(groups) / groups.length;

   // standard error for CI
   $: sd = Math.sqrt((1 - sampProp) * sampProp / sample.length);

   // PDF curve for sampling distribution
   $: x = Vector.seq(0, 1, 0.01);
   $: f = dnorm(x, popProp, sd);
   $: pValue = getpvalue(pnorm, sampProp, tail, [popProp, sd]);


   // critical values
   $: dp = Math.abs(popProp - sampProp)
   $: crit = tail === 'both' ? [popProp - dp, popProp + dp] : [sampProp];
   $: H0LegendStr = `<tspan>H0: π(</tspan><tspan font-weight=bold fill=#336688>o</tspan><tspan>) ${signs[tail]} ${popProp.toFixed(2)}</tspan>`;
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