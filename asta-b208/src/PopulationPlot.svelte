<script>
   import { Vector } from 'mdatools/arrays';
   import { max } from 'mdatools/stat';
   import { dnorm } from 'mdatools/distributions';

   import { Lines, Segments, TextLabels, Area } from 'svelte-plots-basic/2d';

   // shared components
   import MeanPopulationPlot from '../../shared/plots/MeanPopulationPlot.svelte';

   export let popH0Mean;
   export let popMean;
   export let popSD;
   export let sample;
   export let colorsPop;
   export let colorsH0;

   const limX = [80, 120];

   // size of population and axes plus coordinates of the points
   $: popX = Vector.seq(popMean - 3.5 * popSD, popMean + 3.5 * popSD, popSD / 100);
   $: popY = dnorm(popX, popMean, popSD);

   $: popH0X = Vector.seq(popH0Mean - 3.5 * popSD, popH0Mean + 3.5 * popSD, popSD/100);
   $: popH0Y = dnorm(popH0X, popH0Mean, popSD);

</script>

<MeanPopulationPlot {popMean} {popSD} {sample} popColor={colorsPop.line}
   popAreaColor={colorsPop.area} sampColor={colorsPop.sample} limY={[0, max(popH0Y) * 1.1]}>

   <Lines xValues={popH0X} yValues={popH0Y} lineColor={colorsH0.line} />
   <Area xValues={popH0X} yValues={popH0Y} lineColor="transparent" fillColor={colorsH0.area} />
   <Segments xStart={[popH0Mean]} xEnd={[popH0Mean]} yStart={[0]} yEnd={[max(popY)]} lineColor={colorsH0.line} lineType={2} />

   <TextLabels xValues={[popH0Mean]} yValues={[max(popH0Y)]} labels={["H0"]} pos={3} faceColor={colorsH0.stat} />
   <TextLabels xValues={[popMean]} yValues={[max(popY)]} labels={["Reality"]} pos={3} faceColor={colorsPop.stat} />

</MeanPopulationPlot>

