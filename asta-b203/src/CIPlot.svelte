<script>
   import {sum, seq, sd, max, dnorm, mean} from 'stat-js';
   import {Axes, XAxis, LineSeries, AreaSeries, TextLegend, Segments} from 'svelte-plots-basic';

   export let popMean;
   export let popSD;
   export let sample;
   export let colors;

   let sampStat = [];
   let sampMean;
   let sampleSize;
   let sampleSizeOld = sample.length;
   let popSDOld = popSD;

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
   $: SE = popSD / Math.sqrt(sampleSize);

   // PDF curve
   $: x = seq(popMean - 3.5 * SE, popMean + 3.5 * SE, 100);
   $: f = dnorm(x, popMean, SE);

   // CI and CI area
   $: ci = [popMean - 1.96 * SE, popMean + 1.96 * SE];
   $: cix = seq(ci[0], ci[1], 100);
   $: cif = dnorm(cix, popMean, SE);

   // if new sample is taken, add true if it is inside CI and false otherwise
   $: sampStat = [...sampStat, sampMean >= ci[0] && sampMean <= ci[1] ? 1 : 0];

   // numeric values for stat table
   $: nSamples = sampStat.length;
   $: nSamplesInside = sum(sampStat);

   // text values for stat table
   $: tableCI = `[${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}]`;
   $: tableNSamplesInside = `# samples inside CI: ${nSamplesInside}/${nSamples} (${(nSamplesInside/nSamples * 100).toFixed(1)}%)`;

</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={[92, 108]} limY={[-0.005, max(f) * 1.70]} xLabel={"Expected sample mean, m"}>

   <!-- statistics -->
   <TextLegend textSize={1.15} x={90} y={max(f) * 1.55} pos={2} dx="1.25em" elements = {[
         tableNSamplesInside,
         "95% CI: " + tableCI,
         "sample mean: " + sampMean.toFixed(1),
         "sample sd: " + sampSD.toFixed(2)
   ]} />

   <AreaSeries xValues={cix} yValues={cif} lineColor={colors[0] + "40"} fillColor={colors[0] + "40"}/>
   <LineSeries xValues={x} yValues={f} lineColor={colors[0] + "40"} />
   <Segments xStart={[sampMean]} xEnd={[sampMean]} yStart={[0]} yEnd={[max(f)]} lineColor={colors[1]} />
   <XAxis slot="xaxis" ></XAxis>
</Axes>

