<script>
   import {seq, dnorm, rep, mean, max, mrange} from 'stat-js';
   import {Axes, XAxis, LineSeries, Segments,  ScatterSeries, AreaSeries} from 'svelte-plots-basic';

   export let popMean;
   export let popSD;
   export let sample;
   export let colors;

   // size of population and axes plus coordinates of the points
   $: popX = seq(popMean - 3.5 * popSD, popMean + 3.5 * popSD, 100);
   $: popY = dnorm(popX, popMean, popSD);
   $: sampY = rep(max(popY) * 0.05, sample.length);
   $: sampMean = mean(sample);
</script>

<Axes title={`Population: µ = ${popMean}, σ = ${popSD.toFixed(1)}`} xLabel={"Chloride in water, [mg/L]"} limX={[80, 120]} limY={mrange(popY, 0.01)}>
   <!-- population points  -->
   <XAxis slot="xaxis"></XAxis>
   <LineSeries xValues={popX} yValues={popY} lineColor={colors[0]} />
   <AreaSeries xValues={popX} yValues={popY} lineColor={"transparent"} fillColor={colors[0] + "30"} />
   <ScatterSeries xValues={sample} yValues={sampY} borderWidth={2} markerSize={1.2} faceColor={"transparent"} borderColor={colors[1]} />

   <Segments xStart={[popMean]} xEnd={[popMean]} yStart={[0]} yEnd={[max(popY)]} lineColor={colors[0]} lineType={2} />
   <Segments xStart={[sampMean]} xEnd={[sampMean]} yStart={[0]} yEnd={[max(popY)]} lineColor={colors[1]} lineType={3} />
   <!-- sample points on top  -->
</Axes>

