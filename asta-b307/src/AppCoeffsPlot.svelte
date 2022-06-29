<script>
   import {sum, seq, mrange, mean, qt} from 'mdatools/stat';
   import {vsubtract, vmult, msubtract, transpose, vadd, mmult} from 'mdatools/matrix';
   import {Axes, YAxis, ScatterSeries, Segments, BarSeries} from 'svelte-plots-basic';
   import { colors } from "../../shared/graasta";

   export let popModel;
   export let globalModel;
   export let localModel;
   export let reset;
   export let ready = true;

   // colors
   const popColor = "#c0c0c0";
   const globalColor = colors.plots.SAMPLES[0] + "60";
   const sampColor = colors.plots.SAMPLES[0];

   // t-value for confidence interval
   $: tCrit = qt(0.975, (globalModel.data.X[0].length - 1));

   // coefficients and errors
   let sampY = [];
   let sampE = [];

   // function which computes JK standard error for regression coefficients
   function getJKVar() {
      const n = sampY.length;
      if (n < 2) return [];

      const B = transpose(sampY);
      const m = B.map(v => mean(v));
      const E = msubtract(B, m);
      sampY = [];

      return mmult(E, E).map(x => Math.sqrt(sum(x) * (n - 1) / n));
   }

   // coefficients for populaiton model
   $: popX = seq(1, popModel.coeffs.estimate.length).map(x => x - 0.25);
   $: popY = popModel.coeffs.estimate;

   // coefficients for global model
   $: globalX = seq(1, globalModel.coeffs.estimate.length).map(x => x + 0.25);
   $: globalY = globalModel.coeffs.estimate;

   // resetting the values
   $: if (reset || localModel === undefined) {
      sampY = [];
      sampE = [];
   }

   // coefficients and errors for local model
   $: sampX = globalX;
   $: sampY = localModel ? [...sampY, localModel.coeffs.estimate] : [];

   // if ready - compute error bars
   $: if (ready) {
      sampE =  getJKVar();
   }
</script>

<Axes limX={[0, 6]} limY={mrange(popY, 0.35)} yLabel="Coefficient">

   <BarSeries barWidth={0.5} xValues={popX} borderColor="white" faceColor={popColor} yValues={popY} />
   <BarSeries barWidth={0.5} xValues={globalX} borderColor="white" faceColor={globalColor} yValues={globalY} />

   {#if !ready }
      {#each sampY as sy, i}
         <ScatterSeries xValues={sampX} yValues={sy} borderWidth={2} borderColor={sampColor + (!ready || i == sampY.length ? "60" : "F0")}/>
      {/each}
   {/if}

   {#if ready && sampE.length > 0 }
      <Segments
         xStart={globalX}  yStart={vsubtract(globalY, vmult(tCrit, sampE))}
         xEnd={globalX}    yEnd={vadd(globalY, vmult(tCrit, sampE))}
         lineColor={sampColor}
      />
      <ScatterSeries xValues={globalX} yValues={globalY} borderColor={sampColor} faceColor={sampColor} />
   {/if}

   <YAxis slot="yaxis" />
</Axes>
