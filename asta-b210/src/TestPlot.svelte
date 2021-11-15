<script>
   import {seq, df, pf, sum, max} from 'stat-js';
   import {Axes, XAxis, TextLegend, LineSeries, AreaSeries, Segments} from 'svelte-plots-basic';

   export let effectExpected;
   export let noiseExpected;
   export let sysSample;
   export let errSample;

   const colors = ["#2233f0", "#2233a0"];

   // variables for collecting cumulative statistics
   let oldEffectExpected = effectExpected;
   let oldNoiseExpected = noiseExpected;
   let nSamples = 0;
   let nSamplesBelow005 = 0;

   $: DoFSys = sysSample.length - 1;
   $: DoFErr = sum(sysSample.map(v => v.length)) - DoFSys - 1;

   $: MSSys = sum(sysSample.map(v => sum(v.map(x => x**2)))) / DoFSys;
   $: MSErr = sum(errSample.map(v => sum(v.map(x => x**2)))) / DoFErr;

   // compute sample statistics
   $: FValue = MSSys/MSErr;

   // PDF curve for sampling distribution
   $: x = seq(0.01, 10, 200);
   $: f = df(x, DoFSys, DoFErr);

   // compute p-value and x/y coordinates for corresponding area under PDF
   $: p = 1 - pf(FValue, DoFSys, DoFErr);
   $: px = FValue < 10 ? seq(FValue, 10, 200) : [];
   $: py = df(px, DoFSys, DoFErr);

   // cumulative statistics
   $: {
      // reset statistics if sample size, population proportion or a test tail has been changed
      if (oldEffectExpected !== effectExpected || oldNoiseExpected !== noiseExpected) {
         oldEffectExpected = effectExpected;
         oldNoiseExpected = noiseExpected;
         nSamples = 0;
         nSamplesBelow005 = 0;
      }

      // count number of samples taken for the same test conditions and how many have p-value < 0.05
      nSamples = nSamples + 1;
      nSamplesBelow005 = nSamplesBelow005 + (p < 0.05);
   }

   $: percentBelow005Str = `# samples with p<0.05 = ${nSamplesBelow005}/${nSamples} (${(100 * nSamplesBelow005/nSamples).toFixed(1)}%)`;
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={[-0.01, 11]} limY={[-0.001, max(f) * 1.30]} xLabel={"Expected F-value for H0: µ<sub>A</sub> = µ<sub>B</sub> = µ<sub>C</sub>"}>

   <!-- statistics -->
   <TextLegend textSize={1.05} x={0} y={max(f) * 1.15} pos={2} dx="3.5em" dy="1.35em" elements = {[
         percentBelow005Str,
         "F: <tspan fill=red font-weight=bold>" + FValue.toFixed(1) + "</tspan>, p-value: " + p.toFixed(3)
   ]} />

   <!-- area for p-value -->
   {#if px.length > 0}
   <AreaSeries xValues={px} yValues={py} lineColor={colors[0] + "40"} fillColor={colors[0] + "40"}/>
   {/if}

   <!-- PDF for sampling distribution -->
   <LineSeries xValues={x} yValues={f} lineColor={colors[0] + "90"} />
   <Segments xStart={[FValue]} xEnd={[FValue]} yStart={[0]} yEnd={[max(f) * 0.75]} lineColor={colors[1]} /> -->

   <XAxis slot="xaxis" ></XAxis>
</Axes>

