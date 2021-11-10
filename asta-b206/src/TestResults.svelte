<script>
   import {sum, seq, round, subset, max, dnorm, pnorm} from 'stat-js';
   import {Axes, XAxis, LineSeries, AreaSeries, TextLegend, Segments} from 'svelte-plots-basic';

   export let groups;   //
   export let sample;
   export let colors;
   export let tail;

   // sign symbols for hypothesis tails
   const signs = {"both": "=", "left": "≥", "right": "≤"};

   // proportions
   let popProp;
   let sampProp;

   // variables for collecting cumulative statistics
   let oldTail = tail;
   let oldPopProp = -1;
   let oldSampSize = -1;
   let nSamples = 0;
   let nSamplesBelow005 = 0;

   // proportion of current sample
   $: sampProp = round(1 - sum(subset(groups, sample).map(v => v - 1)) / sample.length, 2);
   $: popProp = 1 - sum(groups.map(v => v - 1)) / groups.length;

   // standard error for CI
   $: sd = round(Math.sqrt((1 - sampProp) * sampProp / sample.length), 3);

   // PDF curve for sampling distribution
   $: x = seq(0, 1, 100);
   $: f = dnorm(x, popProp, sd);

   // p-value and p-value area
   let px, pf, p;
   $: {

      // compute p-value and coordinates of corresponding area on the plot
      if (tail === "left") {
         px = [seq(0, sampProp, 100)];
         p = pnorm(sampProp, popProp, sd)[0];
      } else if (tail === "right") {
         px = [seq(sampProp, 1, 100)];
         p = 1 - pnorm(sampProp, popProp, sd)[0];
      } else {
         const dp = Math.abs(sampProp - popProp);
         px = [seq(0, popProp - dp, 100), seq(popProp + dp, 1, 100)];
         p = 2 * pnorm((popProp - dp), popProp, sd)[0];
      }

      // compute density values for the area points
      pf = px.map(v => dnorm(v, popProp, sd));
   }

   // cumulative statistics
   $: {

      // reset statistics if sample size, population proportion or a test tail has been changed
      if (oldSampSize !== sample.length || oldPopProp !== popProp || oldTail !== tail || sd === 0) {
         oldSampSize = sample.length;
         oldPopProp = popProp;
         oldTail = tail;
         nSamples = 0;
         nSamplesBelow005 = 0;
      }

      // count number of samples taken for the same test conditions and how many have p-value < 0.05
      nSamples = nSamples + 1;
      nSamplesBelow005 = nSamplesBelow005 + (p < 0.05);
   }

   $: H0LegendStr = `H0: π(<tspan fill=red>o</tspan>) ${signs[tail]} ${popProp.toFixed(2)}`;
   $: percentBelow005Str = `# samples with p < 0.05 = ${nSamplesBelow005}/${nSamples} (${(100 * nSamplesBelow005/nSamples).toFixed(1)}%)`;
</script>

{#if sd > 0}
<!-- plot with sampling distribution, current sample proportion and area corresponding to p-value -->
<Axes limX={[-0.02, 1.02]} limY={[-0.01, max(f) * 1.65]}>

   <!-- statistics -->
   <TextLegend textSize={1.25} x={90} y={max(f) * 1.55} pos={2} dx="2em" elements = {[
         percentBelow005Str,
         H0LegendStr,
         "p-value: " + p.toFixed(3),
         "sample prop.: " + sampProp.toFixed(2)
   ]} />

   <!-- area for p-value -->
   {#each px as x, i}
   <AreaSeries xValues={x} yValues={pf[i]} lineColor={colors[0] + "40"} fillColor={colors[0] + "40"}/>
   {/each}

   <!-- sampling distribution -->
   <LineSeries xValues={x} yValues={f} lineColor={colors[0] + "40"} />
   <Segments xStart={[sampProp]} xEnd={[sampProp]} yStart={[0]} yEnd={[max(f)]} lineColor={colors[0]} />

   <XAxis slot="xaxis" ></XAxis>
</Axes>
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