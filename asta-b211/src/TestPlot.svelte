<script>
   import {seq, df, pf, sum, max} from "stat-js";
   import {TextLegend} from "svelte-plots-basic";

   // shared components
   import {formatLabels} from "../../shared/graasta.js";

   // shared components - plots
   import TestPlot from "../../shared/plots/TestPlot.svelte";


   export let sysSample;
   export let errSample;
   export let reset;
   export let clicked;

   const H0LegendStr = "H0: µA = µB = µC";

   $: DoFSys = sysSample.length - 1;
   $: DoFErr = sum(sysSample.map(v => v.length)) - DoFSys - 1;

   $: MSSys = sum(sysSample.map(v => sum(v.map(x => x**2)))) / DoFSys;
   $: MSErr = sum(errSample.map(v => sum(v.map(x => x**2)))) / DoFErr;

   // compute sample statistics
   $: crit = MSSys/MSErr;

   // PDF curve for sampling distribution
   $: x = seq(0.01, 10, 200);
   $: f = df(x, DoFSys, DoFErr);

   // compute p-value and x/y coordinates for corresponding area under PDF
   $: pValue = 1 - pf(crit, DoFSys, DoFErr);

</script>

<TestPlot {x} {f} {pValue} {reset} {clicked} {H0LegendStr} crit={[crit]} alpha={0.05} tail="right">
   <!-- add legend item with current F-value -->
   <TextLegend textSize={1.15} left={-0.2} top={max(f) * 1.05} dx="0em"
      elements={formatLabels([{name: "F-value", value: crit.toFixed(1)}])} />
</TestPlot>
