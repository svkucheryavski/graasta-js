<script>
   import {sum, seq, sd, max, dt, mean, subset, closestIndex} from 'stat-js';
   import {Axes, XAxis, LineSeries, AreaSeries, Segments} from 'svelte-plots-basic';
   import {DataTable} from 'svelte-plots-stat';

   export let popMean;
   export let popSD;
   export let sample;
   export let colors;

   let sampStat = [];
   let sampMean;
   let sampleSize;
   let sampleSizeOld = sample.length;
   let popSDOld = popSD;

   // critical t-values for the sample sizes
   const tVals = {5: 2.776445, 10: 2.262157, 20: 2.093024, 40: 2.022691};

   // when sample size has changed - reset statistics
   $: {
      sampleSize = sample.length;
      if (sampleSize != sampleSizeOld || popSD != popSDOld) {
         sampleSizeOld = sampleSize;
         popSDOld = popSD;
         sampStat = [];
      }
   }

   // mean of current sample
   $: sampMean = mean(sample);
   $: sampSD = sd(sample);
   $: SE = sampSD / Math.sqrt(sampleSize);

   // PDF curve
   $: tCrit = tVals[sampleSize];
   $: t = seq(-tCrit * 1.5, tCrit * 1.5, 1000);
   $: f = dt(t, sampleSize - 1);
   $: x = t.map(v => v * SE + sampMean);

   // CI and CI area
   $: ci = [sampMean - tCrit * SE, sampMean + tCrit * SE];
   $: ciXInd = seq(closestIndex(x, ci[0]), closestIndex(x, ci[1]));
   $: cix = subset(x, ciXInd);
   $: cif = subset(f, ciXInd);

   // if new sample is taken, add true if it is inside CI and false otherwise
   $: sampStat = [...sampStat, popMean >= ci[0] && popMean <= ci[1] ? 1 : 0];

   // numeric values for stat table
   $: nSamples = sampStat.length;
   $: nSamplesInside = sum(sampStat);

   // text values for stat table
   $: tableSampMean = sampMean.toFixed(2)
   $: tableCI = `[${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}]`;
   $: tableNSamplesInside = `${nSamplesInside} (${(nSamplesInside/nSamples * 100).toFixed(1)}%)`;
</script>

<div class="ci-plot">
   <!-- plot with population based CI and position of current sample proportion -->
   <Axes limX={[92, 108]} limY={[-0.005, max(f) * 1.1]} xLabel={"Estimated population mean, µ"}>
      <AreaSeries xValues={cix} yValues={cif} lineColor={colors[1] + "20"} fillColor={colors[1] + "20"}/>
      <LineSeries xValues={x} yValues={f} lineColor={colors[1] + "20"} />
      <Segments xStart={[popMean]} xEnd={[popMean]} yStart={[0]} yEnd={[max(f) * 1.1]} lineColor={colors[0]} />
      <XAxis slot="xaxis" ></XAxis>
   </Axes>
</div>

<div class="stat-table">
   <!-- plot with statistics -->
   <DataTable
      variables={[
         {label: "Confidence interval (CI)", values: [tableCI]},
         {label: "Mean of current sample", values: [tableSampMean]},
         {label: "SD of current sample", values: [sampSD.toFixed(1)]},
         {label: "Citical t-value", values: [tCrit.toFixed(2)]},
         {label: "# samples taken", values: [nSamples]},
         {label: "# samples with µ inside CI", values: [tableNSamplesInside]},
      ]}
      decNum={[0, 0, 0, 0, 0]}
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