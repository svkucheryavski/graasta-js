<script>
   import { dnorm } from 'mdatools/distributions';
   import { Vector, vector, c } from 'mdatools/arrays';
   import { min, max } from 'mdatools/stat';
   import  CIPlot from './CIPlot.svelte';

   export let lineColor = '#000000';
   export let mainColor = '#6f6666';

   export let ciCenter;
   export let ciSD;
   export let ciStat;
   export let clicked;
   export let labelStr = '# samples with π inside';
   export let xLabel = 'Expected sample proportion';
   export let reset = false;

   // PDF curve
   let x, f, cix, cif, ci, errmsg = '';

   $: if (ciSD > 0) {
      errmsg = '';
      x = Vector.seq(min([0, ciCenter - 3.5 * ciSD]), max([ciCenter + 3.5 * ciSD, 1]), ciSD / 100);
      f = dnorm(x, ciCenter, ciSD);

      // CI and CI area
      ci = [max([0, ciCenter - 1.96 * ciSD]), min([1, ciCenter + 1.96 * ciSD])];
      cix = Vector.seq(ci[0], ci[1], (ci[1] - ci[0]) / 100);
      cif = dnorm(cix, ciCenter, ciSD);
   } else {
      errmsg = 'The sample contains individuals only from one group, can not compute standard error.';
   }
</script>

<CIPlot limX={[-0.025, 1.025]} {clicked} {x} {f} {cix} {cif} {ci} {ciStat} {errmsg} {lineColor} {mainColor} {xLabel} {labelStr} {reset} />