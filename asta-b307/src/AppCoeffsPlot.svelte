<script>
   import { Vector, Index, cbind, ismatrix } from 'mdatools/arrays';
   import { ssq, mrange, mean } from 'mdatools/stat';
   import { qt } from 'mdatools/distributions';

   import { Axes, YAxis, Points, Segments, Bars } from 'svelte-plots-basic/2d';
   import { colors } from '../../shared/graasta.js';

   export let popModel;
   export let globalModel;
   export let localModel;
   export let reset;
   export let ready = true;

   // colors
   const popColor = '#c0c0c0';
   const globalColor = colors.plots.SAMPLES[0] + '60';
   const sampColor = colors.plots.SAMPLES[0];

   // t-value for confidence interval
   $: tCrit = qt(0.975, (globalModel.data.X.nrows - 1));

   // coefficients and errors
   let sampY = [];
   let sampE = [];
   let sampErrMargin = [];

   // function which computes JK standard error for regression coefficients
   function getJKVar() {
      const n = sampY.ncols;

      if (n < 2) return [];
      const B = sampY.t();
      const m = B.apply(mean, 2);
      const E = B.subtract(m);
      return E.apply(ssq, 2).mult((n - 1) / n).apply(Math.sqrt);
   }

   // coefficients for populaiton model
   $: popX = Vector.seq(1, popModel.coeffs.estimate.length).subtract(0.25);
   $: popY = popModel.coeffs.estimate;

   // coefficients for global model
   $: globalX = Vector.seq(1, globalModel.coeffs.estimate.length).add(0.25);
   $: globalY = globalModel.coeffs.estimate;

   // resetting the values
   $: if (reset || localModel === undefined) {
      sampY = [];
      sampE = [];
   }

   // coefficients and errors for local model
   $: sampX = globalX;
   $: sampY = localModel ?
      (sampY.length  === 0 ?
         cbind(localModel.coeffs.estimate) :
         cbind(sampY, localModel.coeffs.estimate)
      ): [];

   // if ready - compute error bars
   $: if (ready) {
      sampE = getJKVar();
      sampErrMargin = sampE.mult(tCrit);
      sampY = [];
   }


</script>

<Axes limX={[0, 6]} limY={mrange(popY, 0.35)} margins={[0.25, 0.65, 0.25, 0.25]} yLabel="Coefficient">

   <Bars barWidth={0.5} xValues={popX} borderColor="white" faceColor={popColor} yValues={popY} />
   <Bars barWidth={0.5} xValues={globalX} borderColor="white" faceColor={globalColor} yValues={globalY} />

   {#if !ready && ismatrix(sampY)}
      {#each Index.seq(1, sampY.ncols) as _, i}
         <Points xValues={sampX} yValues={sampY.getcolumn(i + 1)} borderWidth={2} borderColor={sampColor + (!ready || i == sampY.length ? "60" : "F0")}/>
      {/each}
   {/if}

   {#if ready && sampE.length > 0 }
      <Segments
         xStart={globalX} yStart={globalY.subtract(sampErrMargin)}
         xEnd={globalX} yEnd={globalY.add(sampErrMargin)}
         lineColor={sampColor}
      />
      <Points xValues={globalX} yValues={globalY} borderColor={sampColor} faceColor={sampColor} />
   {/if}

   <YAxis slot="yaxis" />
</Axes>
