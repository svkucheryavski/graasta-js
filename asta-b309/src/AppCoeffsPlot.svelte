<script>
   import { vector, Vector } from 'mdatools/arrays';
   import { max } from 'mdatools/stat';
   import { Axes, YAxis, XAxis, Points, Bars } from 'svelte-plots-basic/2d';

   export let popCoeffs;
   export let sampCoeffs;
   export let corr;
   export let sampSize;
   export let yErr;

   let oldCorr = corr;
   let oldSampSize = sampSize;
   let oldYErr = yErr;
   let popColor = '#d8d8d8';
   let sampY = [];

   // population and sample regression lines

   $: xValues = Vector.seq(1, popCoeffs.length);
   $: popY = popCoeffs;
   $: if (corr !== oldCorr || yErr !== oldYErr || sampSize !== oldSampSize) {
      oldCorr = corr;
      oldYErr = yErr;
      oldSampSize = sampSize;
      sampY = [];
   }

   $: sampY = [...sampY, sampCoeffs] ;
</script>

<Axes limX={[0, 4]} limY={[-1, max(popY) * 1.2]} yLabel="Coefficient" margins={[0.5, 0.75, 0.25, 0.25]}>

   <Bars title="population" xValues={xValues} borderColor="transparent" faceColor={popColor} yValues={popY} />
   {#each sampY as sy, i}
   <Points title="sample" xValues={xValues} yValues={sy}
         borderWidth={i < (sampY.length - 1) ? 1 : 3}
         borderColor={i < (sampY.length - 1) ? "#a0a0a0a0" : "#9090ff"}
         faceColor={i < (sampY.length - 1) ? "transparent" : "#9090ff"}
         />
   {/each}
   <YAxis slot="yaxis" />
   <XAxis slot="xaxis" ticks={vector([1, 2, 3])} tickLabels={["b0", "b1", "b2"]}/>
</Axes>
