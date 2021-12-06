<script>
   import {seq, dnorm, mean} from 'stat-js';
   import  CIPlot from "../../shared/plots/CIPlot.svelte";

   export let lineColor = "#000000";
   export let mainColor = "#6f6666";

   export let popMean;
   export let popSD;
   export let sample;

   export let clicked;
   export let labelStr = "# samples inside CI";
   export let xLabel = "Expected sample mean";
   export let reset = false;
   export let errmsg = "";

   $: ciCenter = popMean;
   $: ciSD = popSD / Math.sqrt(sample.length);
   $: ciStat = mean(sample);

   // PDF curve
   $: x = seq(ciCenter - 3.5 * ciSD, ciCenter + 3.5 * ciSD, 100);
   $: f = dnorm(x, ciCenter, ciSD);

   // CI and CI area
   $: ci = [ciCenter - 1.96 * ciSD, ciCenter + 1.96 * ciSD];
   $: cix = seq(ci[0], ci[1], 100);
   $: cif = dnorm(cix, ciCenter, ciSD);
</script>

<CIPlot limX={[92, 108]} {clicked} {x} {f} {cix} {cif} {ci} {ciStat} {errmsg} {lineColor} {mainColor} {xLabel} {labelStr} {reset} />