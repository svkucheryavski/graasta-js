<script>
   import { seq, min, max, dnorm } from 'mdatools/stat';
   import  CIPlot from "./CIPlot.svelte";

   export let lineColor = "#000000";
   export let mainColor = "#6f6666";

   export let ciCenter;
   export let ciSD;
   export let ciStat;
   export let clicked;
   export let labelStr = "# samples with π inside";
   export let xLabel = "Expected sample proportion";
   export let reset = false;


   // PDF curve
   $: x = seq(min([0, ciCenter - 3.5 * ciSD]), max([ciCenter + 3.5 * ciSD, 1]), 100);
   $: f = dnorm(x, ciCenter, ciSD);

   // CI and CI area
   $: ci = [max([0, ciCenter - 1.96 * ciSD]), min([1, ciCenter + 1.96 * ciSD])];
   $: cix = seq(ci[0], ci[1], 100);
   $: cif = dnorm(cix, ciCenter, ciSD);
   $: errmsg = ciSD > 0 ? "" : "The sample contains individuals only from one group, can not compute standard error.";
</script>

<CIPlot {clicked} {x} {f} {cix} {cif} {ci} {ciStat} {errmsg} {lineColor} {mainColor} {xLabel} {labelStr} {reset} />