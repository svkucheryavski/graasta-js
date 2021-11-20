<script>
   import {seq, dnorm, rep, mean, max} from 'stat-js';
   import {Axes, XAxis, LineSeries, Segments, TextLabels, ScatterSeries, AreaSeries} from 'svelte-plots-basic';

   export let popH0Mean;
   export let popMean;
   export let popSD;
   export let sample;
   export let colors;

   // size of population and axes plus coordinates of the points
   $: popX = seq(popMean - 3.5 * popSD, popMean + 3.5 * popSD, 100);
   $: popY = dnorm(popX, popMean, popSD);

   $: popH0X = seq(popH0Mean - 3.5 * popSD, popH0Mean + 3.5 * popSD, 100);
   $: popH0Y = dnorm(popH0X, popH0Mean, popSD);

   $: sampY = rep(max(popY) * 0.05, sample.length);
   $: sampMean = mean(sample);
</script>

<Axes title={`Population: µ = ${popMean}, σ = ${popSD.toFixed(1)}`} xLabel={"Chloride in water, [mg/L]"} limX={[80, 120]} limY={[0, max(popY) * 1.1]}>
   <!-- population distribution (H0) -->
   <LineSeries xValues={popH0X} yValues={popH0Y} lineColor={colors[0]} />
   <AreaSeries xValues={popH0X} yValues={popH0Y} lineColor={"transparent"} fillColor={colors[0] + "30"} />
   <Segments xStart={[popH0Mean]} xEnd={[popH0Mean]} yStart={[0]} yEnd={[max(popY)]} lineColor={colors[0]} lineType={2} />
   <TextLabels xValues={[popH0Mean]} yValues={[max(popH0Y)]} labels={["H0"]} pos={3} faceColor={colors[0]} />

   <!-- population distribution (real)  -->
   <LineSeries xValues={popX} yValues={popY} lineColor={colors[1]} />
   <AreaSeries xValues={popX} yValues={popY} lineColor={"transparent"} fillColor={colors[1] + "20"} />
   <Segments xStart={[popMean]} xEnd={[popMean]} yStart={[0]} yEnd={[max(popY)]} lineColor={colors[1]} lineType={2} />
   <TextLabels xValues={[popMean]} yValues={[max(popY)]} labels={["Reality"]} pos={3} faceColor={colors[1]} />

   <!-- sample points at bottom  -->
   <ScatterSeries xValues={sample} yValues={sampY} borderWidth={2} markerSize={1.2} faceColor={"transparent"} borderColor={colors[1]} />

   <Segments xStart={[sampMean]} xEnd={[sampMean]} yStart={[0]} yEnd={[max(popY)]} lineColor={colors[1]} lineType={3} />
   <XAxis slot="xaxis"></XAxis>
</Axes>

