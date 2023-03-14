<script>
   import { Vector } from 'mdatools/arrays';
   import { df, pf } from 'mdatools/distributions';
   import { sum, mean, max } from 'mdatools/stat';
   import { TextLegend } from 'svelte-plots-basic/2d';

   // shared components
   import { formatLabels } from '../graasta.js';

   // shared components - plots
   import TestPlot from './TestPlot.svelte';

   export let mainColor = '#a0a0a0';
   export let sysSample;
   export let errSample;
   export let reset;
   export let clicked;

   const H0LegendStr = 'H0: µA = µB = µC';

   $: DoFSys = sysSample.length - 1;
   $: DoFErr = sum(sysSample.map(v => v.length)) - DoFSys - 1;
   $: grandMean = mean(sysSample.map(v => v.v[0]));

   $: MSSys = sum(sysSample.map(v => sum(v.apply(x => (x - grandMean)**2)))) / DoFSys;
   $: MSErr = sum(errSample.map(v => sum(v.apply(x => x**2)))) / DoFErr;

   // compute sample statistics
   $: crit = MSSys/MSErr;

   // PDF curve for sampling distribution
   $: x = Vector.seq(0.01, 10, 0.01);
   $: f = df(x, DoFSys, DoFErr);

   // compute p-value and x/y coordinates for corresponding area under PDF
   $: pValue = 1 - pf(crit, DoFSys, DoFErr);
   $: console.log(sysSample.map(v => sum(v.apply(x => (x - grandMean)**2))))
   $: console.log(MSErr)
</script>

<TestPlot limX={[-0.2, 10]} {x} {f} {pValue} {reset} {clicked} {H0LegendStr} {mainColor} crit={[crit]} alpha={0.05} tail="right">
   <!-- add legend item with current F-value -->
   <TextLegend textSize={1.15} left={4} top={max(f) * 0.5} dx="0"
      elements={formatLabels([{name: "F-value", value: crit.toFixed(1)}])} />
</TestPlot>
