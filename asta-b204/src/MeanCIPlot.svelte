<script>
   import {seq, sd, dt, qt, mean} from "mdatools/stat";
   import  CIPlot from "../../shared/plots/CIPlot.svelte";

   export let lineColor = "#000000";
   export let mainColor = "#6f6666";

   export let popMean;
   export let sample;

   export let clicked;
   export let labelStr = "# samples with µ inside CI";
   export let xLabel = "Expected population mean";
   export let reset = false;
   export let errmsg = "";

   $: sampSize = sample.length;
   $: DoF = sampSize - 1;
   $: ciCenter = mean(sample);
   $: ciSD = sd(sample) / Math.sqrt(sampSize);
   $: ciStat = popMean;

   // PDF curve
   $: t = seq(-5, 5, 200);
   $: x = t.map(v => v * ciSD + ciCenter);
   $: f = dt(t, DoF);

   // CI and CI area
   $: tCrit = qt(0.975, sample.length - 1)
   $: ci = [ciCenter - tCrit * ciSD, ciCenter + tCrit * ciSD];
   $: cit = seq(-tCrit, tCrit, 200);
   $: cix = cit.map(v => v * ciSD + ciCenter);
   $: cif = dt(cit, DoF);
</script>

<CIPlot limX={[85, 115]} {clicked} {x} {f} {cix} {cif} {ci} {ciStat} {errmsg} {lineColor} {mainColor} {xLabel} {labelStr} {reset} />