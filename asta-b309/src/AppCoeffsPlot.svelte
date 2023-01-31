<script>
   import {seq, max} from 'mdatools/stat';
   import {Axes, YAxis, XAxis, ScatterSeries, BarSeries} from 'svelte-plots-basic';

   export let popCoeffs;
   export let sampCoeffs;
   export let corr;

   let oldCorr = corr;
   let popColor = "#d8d8d8";
   let sampY = [];

   // population and sample regression lines

   $: xValues = seq(1, popCoeffs.length);
   $: popY = popCoeffs;
   $: if (corr !== oldCorr) {
      oldCorr = corr;
      sampY = [];
   }

   $: sampY = [...sampY, sampCoeffs] ;
</script>

<Axes limX={[0, 4]} limY={[-1, max(popY) * 1.2]} yLabel="Coefficient">

   <BarSeries title="population" xValues={xValues} borderColor="transparent" faceColor={popColor} yValues={popY} />
   {#each sampY as sy, i}
   <ScatterSeries title="sample" xValues={xValues} yValues={sy}
         borderWidth={i < (sampY.length - 1) ? 1 : 3}
         borderColor={i < (sampY.length - 1) ? "#a0a0a0a0" : "#9090ff"}
         faceColor={i < (sampY.length - 1) ? "transparent" : "#9090ff"}

         />
   {/each}
   <YAxis slot="yaxis" />
   <XAxis slot="xaxis" ticks={[1, 2, 3]} tickLabels={["b0", "b1", "b2"]}/>
</Axes>
