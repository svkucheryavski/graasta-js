<script>
   import {seq, dnorm, rep, mean, sd, max, mrange} from 'stat-js';
   import {Axes, XAxis, LineSeries, Segments,  TextLegend, ScatterSeries, AreaSeries} from 'svelte-plots-basic';
   import { formatLabels } from '../../shared/graasta';

   export let popMean;
   export let popSD;
   export let sample;
   export let popColor;
   export let popAreaColor;
   export let sampColor;

   // size of population and axes plus coordinates of the points
   $: popX = seq(popMean - 3.5 * popSD, popMean + 3.5 * popSD, 100);
   $: popY = dnorm(popX, popMean, popSD);
   $: sampY = rep(max(popY) * 0.05, sample.length);
   $: sampMean = mean(sample);

   // text values for stat table
   $: labelsStr = formatLabels([
      {name: "Sample mean", value: mean(sample).toFixed(1)},
      {name: "Sample sd", value: sd(sample).toFixed(1)}
   ])
</script>

<Axes title={`Population: µ = ${popMean}, σ = ${popSD.toFixed(1)}`} xLabel={"Chloride in water, [mg/L]"} limX={[80, 120]} limY={mrange(popY, 0.01)}>
   <!-- population distribution and mean  -->
   <XAxis slot="xaxis"></XAxis>
   <LineSeries xValues={popX} yValues={popY} lineColor={popColor} />
   <AreaSeries xValues={popX} yValues={popY} lineColor={"transparent"} fillColor={popAreaColor}  />
   <Segments xStart={[sampMean]} xEnd={[sampMean]} yStart={[0]} yEnd={[max(popY)]} lineColor={sampColor} lineType={3} />

   <!-- sample points and mean  -->
   <ScatterSeries xValues={sample} yValues={sampY} borderWidth={2} markerSize={1.25} faceColor={"transparent"} borderColor={sampColor} />
   <Segments xStart={[popMean]} xEnd={[popMean]} yStart={[0]} yEnd={[max(popY)]} lineColor={popColor} lineType={2} />

   <!-- sample statistics -->
   <TextLegend textSize={1.15} x={90} y={max(popY) * 0.40} pos={2} dx="1.25em" elements = {labelsStr} />
</Axes>

