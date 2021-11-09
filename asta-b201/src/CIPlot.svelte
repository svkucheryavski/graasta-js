<script>
   import {sum, seq, subset, min, max, dnorm} from 'stat-js';
   import {Axes, XAxis, LineSeries, AreaSeries, TextLabels, Segments} from 'svelte-plots-basic';

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
   $: tableCI = `[${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}]`;
   $: tableNSamplesInside = `# samples inside CI: ${nSamplesInside}/${nSamples} (${(nSamplesInside/nSamples * 100).toFixed(1)}%)`;

   // text size for legend with statistics
   const ts = 1.25;
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={[-0.02, 1.02]} limY={[-0.01, max(f) * 1.65]}>

   <!-- statistics -->
   <TextLabels textSize={ts} xValues={[10]} yValues={[max(f) * 1.55]} pos={2} labels={
      "<tspan x=2em dx=0 dy=0.00em>" + tableNSamplesInside + "</tspan>" +
      "<tspan x=2em dx=0 dy=1.25em>" + "95% CI: " + tableCI + "</tspan>" +
      "<tspan x=2em dx=0 dy=1.25em>" + "sample prop.: " + sampProp.toFixed(2) + "</tspan>"
   } />

   <AreaSeries xValues={cix} yValues={cif} lineColor={colors[0] + "40"} fillColor={colors[0] + "40"}/>
   <LineSeries xValues={x} yValues={f} lineColor={colors[0] + "40"} />
   <Segments xStart={[sampProp]} xEnd={[sampProp]} yStart={[0]} yEnd={[max(f)]} lineColor={colors[0]} />
   <XAxis slot="xaxis" ></XAxis>
</Axes>
