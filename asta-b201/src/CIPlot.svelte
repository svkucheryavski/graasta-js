<script>
   import {sum, seq, subset, min, max, dnorm} from 'stat-js';
   import {Axes, XAxis, LineSeries, AreaSeries, Segments} from 'svelte-plots-basic';
   import {DataTable} from 'svelte-plots-stat';

   export let groups;
   export let sample;
   export let colors;

   let sampStat = [];
   let popProp;
   let sampProp;
   let sampleSize;
   let sampleSizeOld = sample.length;

   // when sample size has changed - reset statistics
   $: {
      sampleSize = sample.length;
      if (sampleSize != sampleSizeOld) {
         sampleSizeOld = sampleSize;
         sampStat = [];
      }
   }

   // proportion of current sample
   $: sampProp = 1 - sum(subset(groups, sample).map(v => v - 1)) / sampleSize;

   // if population has changed - reset statistics
   $: {
      popProp = 1 - sum(groups.map(v => v - 1)) / groups.length;
      sampStat = [];
   }

   // standard error for CI
   $: sd = Math.sqrt((1 - popProp) * popProp / sampleSize);

   // PDF curve
   $: x = seq(popProp - 3.5 * sd, popProp + 3.5 * sd, 100);
   $: f = dnorm(x, popProp, sd);

   // CI and CI area
   $: ci = [max([0, popProp - 1.96 * sd]), min([1, popProp + 1.96 * sd])];
   $: cix = seq(ci[0], ci[1], 100);
   $: cif = dnorm(cix, popProp, sd);

   // if new sample is taken, add true if it is inside CI and false otherwise
   $: sampStat = [...sampStat, sampProp >= ci[0] && sampProp <= ci[1] ? 1 : 0];

   // numeric values for stat table
   $: nSamples = sampStat.length;
   $: nSamplesInside = sum(sampStat);

   // text values for stat table
   $: tableSampProp = sampProp.toFixed(2)
   $: tableCI = `[${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}]`;
   $: tableNSamplesInside = `${nSamplesInside} (${(nSamplesInside/nSamples * 100).toFixed(1)}%)`;
</script>

<div class="ci-plot">
   <!-- plot with population based CI and position of current sample proportion -->
   <Axes limX={[-0.02, 1.02]} limY={[-0.01, max(f) * 1.1]}>
      <AreaSeries xValues={cix} yValues={cif} lineColor={colors[0] + "40"} fillColor={colors[0] + "40"}/>
      <LineSeries xValues={x} yValues={f} lineColor={colors[0] + "40"} />
      <Segments xStart={[sampProp]} xEnd={[sampProp]} yStart={[0]} yEnd={[max(f) * 1.1]} lineColor={colors[0]} />
      <XAxis slot="xaxis" ></XAxis>
   </Axes>
</div>

<div class="stat-table">
   <!-- plot with statistics -->
   <DataTable
      variables={[
         {label: "Confidence interval (CI)", values: [tableCI]},
         {label: "Proportion of current sample", values: [tableSampProp]},
         {label: "# of samples taken", values: [nSamples]},
         {label: "# of samples inside CI", values: [tableNSamplesInside]},
      ]}
      decNum={[0, 0]}
      horizontal={true}
   />
</div>

<style>
   .stat-table {
      padding: 1em;
   }

   .stat-table :global(.datatable) {
      font-size: 0.85em;
      color: #606060;
   }

   .stat-table :global(.datatable__label) {
      font-weight: normal;
   }

   .stat-table :global(.datatable__value) {
      padding-left: 1em;
      font-weight: bold;
      color: #505050;
   }
</style>