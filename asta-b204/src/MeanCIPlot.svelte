<script>
   import { Vector } from 'mdatools/arrays';
   import { dt, qt } from 'mdatools/distributions';
   import { sd, mean } from 'mdatools/stat';

   import  CIPlot from '../../shared/plots/CIPlot.svelte';

   export let lineColor = '#000000';
   export let mainColor = '#6f6666';

   export let popMean;
   export let sample;

   export let clicked;
   export let labelStr = '# samples with µ inside CI';
   export let xLabel = 'Expected population mean';
   export let reset = false;
   export let errmsg = '';

   $: sampSize = sample.length;
   $: DoF = sampSize - 1;
   $: ciCenter = mean(sample);
   $: ciSD = sd(sample) / Math.sqrt(sampSize);
   $: ciStat = popMean;

   // PDF curve
   $: t = Vector.seq(-5, 5, 0.01);
   $: x = t.apply(v => v * ciSD + ciCenter);
   $: f = dt(t, DoF);

   // CI and CI area
   $: tCrit = qt(0.975, sample.length - 1)
   $: ci = [ciCenter - tCrit * ciSD, ciCenter + tCrit * ciSD];
   $: cit = Vector.seq(-tCrit, tCrit, 0.01);
   $: cix = cit.apply(v => v * ciSD + ciCenter);
   $: cif = dt(cit, DoF);
</script>

<CIPlot limX={[85, 115]} {clicked} {x} {f} {cix} {cif} {ci} {ciStat} {errmsg} {lineColor} {mainColor} {xLabel} {labelStr} {reset} />