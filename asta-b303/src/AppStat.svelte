<script>
   import {cov, sd, seq, dnorm} from 'mdatools/stat';
   import DataTable from "../../shared/tables/DataTable.svelte"
   import CIPlot from "../../shared/plots/CIPlot.svelte";

   export let sampX;
   export let sampY;
   export let popX;
   export let popY;
   export let clicked;
   export let reset;
   export let plotType = "r";

   function z2r(z) {
      return z.map(v => (Math.exp(2 * v) - 1) / (Math.exp(2 * v) + 1));
   }

   function r2z(r) {
      return r.map(v => 0.5 * Math.log( (1 + v) / (1 - v)));
   }

   // sample statistics
   $: sampCov = cov(sampX, sampY);
   $: sampSdX = sd(sampX);
   $: sampSdY = sd(sampY);
   $: sampCor = sampCov / (sampSdX * sampSdY);
   $: sampZ = r2z([sampCor])[0];

   // population parameters
   $: popCov = cov(popX, popY);
   $: popSdX = sd(popX);
   $: popSdY = sd(popY);
   $: popCor = popCov / (popSdX * popSdY);
   $: popZ = r2z([popCor])[0];

   // z' distribution
   $: zmu = sampZ;
   $: zse = 1 / Math.sqrt(sampX.length - 3)
   $: zx = seq(zmu - 3.5 * zse, zmu + 3.5 * zse, 200)
   $: zf = dnorm(zx, zmu, zse);
   $: zci = [zmu - 1.96 * zse, zmu + 1.96 * zse];
   $: cizx = seq(zci[0], zci[1], 100);
   $: cizf = dnorm(cizx, zmu, zse);

   // r distribution
   $: rx = z2r(zx);
   $: rf = zf;
   $: rci = z2r(zci);
   $: cirx = z2r(cizx);
   $: cirf = cizf;

</script>

<div class="table-container">
<DataTable
   variables={[
      {label: "cov(x,y)", values: [sampCov, popCov]},
      {label: "sd(x)", values: [sampSdX, popSdX]},
      {label: "sd(y)", values: [sampSdY, popSdY]},
      {label: "r(x, y)", values: [sampCor, popCor]},
      {label: "z'(x, y)", values: [sampZ, zmu]},
   ]}
   decNum={[2, 2, 2, 3, 3]}
   horizontal={true}
/>
</div>

<div class="plot-container">
   {#if plotType == "r"}
   <CIPlot {clicked} {reset} x={rx} f={rf} limX={[-1, 1]} cix={cirx} cif={cirf} ci={rci}
      ciStat={popCor} xLabel="Expected ρ for population"
      labelStr="# samples with ρ inside:"/>
   {:else}
   <CIPlot {clicked} {reset} x={zx} f={zf} limX={[-5, 5]} cix={cizx} cif={cizf} ci={zci}
      ciStat={popZ} xLabel="Expected z' for population"
      labelStr="# samples with z' inside:"/>
   {/if}
</div>



<style>
.table-container {
   padding: 1em;
   height: auto;
}

.plot-container {
   padding: 0 1em 0.25em 1em;
   height: 100%;
}

.table-container :global(.datatable) {
   width: 100%;
   font-size: 0.9em;
}

.table-container :global(.datatable > .datatable__row > .datatable__value) {
   padding-right: 1em;
}

.table-container :global(.datatable > .datatable__row > .datatable__value:last-child) {
   background: #f0f0f0;
   color: #808080;
}
</style>

