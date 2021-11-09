<script>
   import {sum, seq, sd, max, dt, mean, subset, closestIndex} from 'stat-js';
   import {Axes, XAxis, LineSeries, AreaSeries, TextLabels, Segments} from 'svelte-plots-basic';

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
   $: tableNSamplesInside = `# samples with µ inside: ${nSamplesInside}/${nSamples} (${(nSamplesInside/nSamples * 100).toFixed(1)}%)`;
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={[92, 108]} limY={[-0.005, max(f) * 1.55]} xLabel={"Estimated population mean, µ"}>

   <!-- statistics -->
   <TextLabels xValues={[92]} yValues={[max(f) * 1.45]} pos={2} labels={tableNSamplesInside} />
   <TextLabels xValues={[92]} yValues={[max(f) * 1.30]} pos={2} labels={"95% CI: " + tableCI} />
   <TextLabels xValues={[92]} yValues={[max(f) * 1.15]} pos={2} labels={`sample mean = ${sampMean.toFixed(2)}`} />
   <TextLabels xValues={[92]} yValues={[max(f) * 1.00]} pos={2} labels={`sample sd = ${sampSD.toFixed(2)}`} />

   <AreaSeries xValues={cix} yValues={cif} lineColor={colors[1] + "20"} fillColor={colors[1] + "20"}/>
   <LineSeries xValues={x} yValues={f} lineColor={colors[1] + "20"} />
   <Segments xStart={[popMean]} xEnd={[popMean]} yStart={[0]} yEnd={[max(f)]} lineColor={colors[0]} />
   <XAxis slot="xaxis" ></XAxis>
</Axes>
