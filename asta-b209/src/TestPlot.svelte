<script>
   import {seq, sd, dt, mean, pt, max} from 'stat-js';
   import {Axes, XAxis, TextLegend, LineSeries, AreaSeries, Segments} from 'svelte-plots-basic';

   export let samples;
   export let effectExpected;
   export let noiseExpected;

   const colors = ["#606060", "#000000"];

   // variables for collecting cumulative statistics
   let oldEffectExpected = effectExpected;
   let oldNoiseExpected = noiseExpected;
   let oldSampSize = samples[0].length;
   let nSamples = 0;
   let nSamplesBelow005 = 0;

   // compute sample statistics
   $: sampSize = samples[0].length;
   $: effectObserved = mean(samples[1]) - mean(samples[0]);
   $: SE = Math.sqrt((sd(samples[1])**2 + sd(samples[0])**2) / samples[0].length);
   $: tValue = Math.abs(effectObserved / SE);

   // PDF curve for sampling distribution
   $: x = seq(- 10 * SE, 10 * SE, 300);
   $: f = dt(x.map(v => v /SE), 2 * sampSize - 2);

   // compute p-value and x/y coordinates for corresponding area under PDF
   $: p = 2 * pt(-tValue, 2 * sampSize - 2);
   $: px = tValue > 10 ? [] : [seq(-10 * SE, -Math.abs(effectObserved), 150), seq(Math.abs(effectObserved), 10 * SE, 150)];
   $: pf = px.map(x => dt(x.map(m => m / SE), 2 * sampSize - 2));

   // cumulative statistics
   $: {

      // reset statistics if sample size, population proportion or a test tail has been changed
      if (oldSampSize !== sampSize || oldEffectExpected !== effectExpected || oldNoiseExpected !== noiseExpected) {
         oldSampSize = sampSize;
         oldEffectExpected = effectExpected;
         oldNoiseExpected = noiseExpected;
         nSamples = 0;
         nSamplesBelow005 = 0;
      }

      // count number of samples taken for the same test conditions and how many have p-value < 0.05
      nSamples = nSamples + 1;
      nSamplesBelow005 = nSamplesBelow005 + (p < 0.05);
   }

   $: H0LegendStr = `H0: µ<tspan font-size="0.75em" baseline-shift="sub">1</tspan> – µ<tspan font-size="0.75em" baseline-shift="sub">2</tspan> = 0`;
   $: percentBelow005Str = `# samples with p < 0.05 = ${nSamplesBelow005}/${nSamples} (${(100 * nSamplesBelow005/nSamples).toFixed(1)}%)`;
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={[-60, 60]} limY={[-0.005, max(f) * 1.50]} xLabel={"Expected value for  (m<sub>1</sub> – m<sub>2</sub>)"}>

   <!-- statistics -->
   <TextLegend textSize={1.05} x={90} y={max(f) * 1.4} pos={2} dx="2em" dy="1.35em" elements = {[
         percentBelow005Str,
         H0LegendStr + ", p-value: " + p.toFixed(3)
   ]} />

   <!-- area for p-value -->
   {#each px as x, i}
   <AreaSeries xValues={x} yValues={pf[i]} lineColor={colors[0] + "40"} fillColor={colors[0] + "40"}/>
   {/each}

   <!-- PDF for sampling distribution -->
   <LineSeries xValues={x} yValues={f} lineColor={colors[0] + "90"} />
   <Segments xStart={[effectObserved]} xEnd={[effectObserved]} yStart={[0]} yEnd={[max(f)]} lineColor={colors[1]} />

   <XAxis slot="xaxis" ></XAxis>
</Axes>

