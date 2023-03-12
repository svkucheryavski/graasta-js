<script>
   import { vector, Vector } from 'mdatools/arrays';
   import { dnorm } from 'mdatools/distributions';
   import { mean, sd, max, mrange } from 'mdatools/stat';

   import { Axes, XAxis, Lines, Segments,  TextLegend, Points, Area } from 'svelte-plots-basic/2d';

   import { formatLabels } from '../../shared/graasta';

   export let popMean;
   export let popSD;
   export let sample;
   export let popColor;
   export let popAreaColor;
   export let sampColor;
   export let limX = [78, 122];
   export let limY = undefined;

   // left position of the legend
   $: left = limX[0] + 0.65 * (limX[1] - limX[0]);

   // parameters of PDF curve
   $: popX = Vector.seq(popMean - 3.5 * popSD, popMean + 3.5 * popSD, popSD/100);
   $: popY = dnorm(popX, popMean, popSD);

   // sample statistics
   $: sampY = vector([max(popY) * 0.05]).rep(sample.length);
   $: sampMean = mean(sample);


   // text values for legend
   $: labelsStr = formatLabels([
      {name: 'Sample mean', value: mean(sample).toFixed(1)},
      {name: 'Sample sd', value: sd(sample).toFixed(1)}
   ])
</script>

<Axes title={`Population: µ = ${popMean}, σ = ${popSD.toFixed(1)}`} xLabel="Chloride in water [mg/L]"
   {limX} limY={limY === undefined ? mrange(popY, 0.01) : limY} margins={[0.75, 0.025, 0.025, 0.025]}>

   <slot></slot>

   <!-- population distribution and mean  -->
   <Lines xValues={popX} yValues={popY} lineColor={popColor} />
   <Area xValues={popX} yValues={popY} lineColor="transparent" fillColor={popAreaColor}  />
   <Segments xStart={[sampMean]} xEnd={[sampMean]} yStart={[0]} yEnd={[max(popY)]} lineColor={sampColor} lineType={3} />

   <!-- sample points and mean  -->
   <Points xValues={sample} yValues={sampY} borderWidth={2} markerSize={1.25} faceColor="transparent" borderColor={sampColor} />
   <Segments xStart={[popMean]} xEnd={[popMean]} yStart={[0]} yEnd={[max(popY)]} lineColor={popColor} lineType={2} />

   <!-- sample statistics -->
   <TextLegend textSize={1.15} {left} top={max(popY) * 0.90} dx="0" elements={labelsStr} />

   <XAxis slot="xaxis"></XAxis>
</Axes>

