<script>
   import { Vector } from 'mdatools/arrays';
   import { mrange } from 'mdatools/stat';
   import {Axes, YAxis, Points, Bars} from 'svelte-plots-basic/2d';

   import { colors } from '../../shared/graasta';

   export let popModel;
   export let sampModel;
   export let reset;


   let popColor = '#d8d8d8';
   let sampColor = colors.plots.SAMPLES[0];
   let sampY = [];

   // population and sample regression lines

   $: popX = Vector.seq(1, popModel.coeffs.estimate.length);
   $: popY = popModel.coeffs.estimate;

   // points and statistics for sample
   $: sampX = popX;
   $: sampY = reset ? [sampModel.coeffs.estimate] : [...sampY, sampModel.coeffs.estimate] ;
</script>

<Axes limX={[0, 5]} limY={mrange(popY, 0.25)} yLabel="Coefficient" margins={[0.25, 0.75, 0.25, 0.25]}>

   <Bars title="population" xValues={popX} borderColor="transparent" faceColor={popColor} yValues={popY} />
   {#each sampY as sy, i}
   <Points title="sample" xValues={sampX} yValues={sy} borderWidth={2}
         borderColor={sampColor + (i < (sampY.length - 1) ? "60" : "F0")}/>
   {/each}
   <YAxis slot="yaxis" />
</Axes>
