<script>
   import {seq, dnorm, rep, mean, max} from "stat-js";
   import {LineSeries, Segments, TextLabels, ScatterSeries, AreaSeries} from "svelte-plots-basic";

   // shared components
   import DistributionPlot from "../../shared/plots/DistributionPlot.svelte";
   import MeanPopulationPlot from "../../shared/plots/MeanPopulationPlot.svelte";

   export let popH0Mean;
   export let popMean;
   export let popSD;
   export let sample;
   export let colorsPop;
   export let colorsH0;


   const limX = [80, 120];
   const xLabel = "Chloride in water, [mg/L]";


   // size of population and axes plus coordinates of the points
   $: popX = seq(popMean - 3.5 * popSD, popMean + 3.5 * popSD, 100);
   $: popY = dnorm(popX, popMean, popSD);

   $: popH0X = seq(popH0Mean - 3.5 * popSD, popH0Mean + 3.5 * popSD, 100);
   $: popH0Y = dnorm(popH0X, popH0Mean, popSD);

   $: sampY = rep(max(popY) * 0.05, sample.length);
   $: sampMean = mean(sample);

   $: title = `Population: µ = ${popMean}, σ = ${popSD.toFixed(1)}`;
   $: limY = [0, max(popY) * 1.1];
</script>

<MeanPopulationPlot {popMean} {popSD} {sample} popColor={colorsPop.line} popAreaColor={colorsPop.area} sampColor={colorsPop.sample}>

   <LineSeries xValues={popH0X} yValues={popH0Y} lineColor={colorsH0.line} />
   <AreaSeries xValues={popH0X} yValues={popH0Y} lineColor={"transparent"} fillColor={colorsH0.area} />
   <Segments xStart={[popH0Mean]} xEnd={[popH0Mean]} yStart={[0]} yEnd={[max(popY)]} lineColor={colorsH0.line} lineType={2} />

   <TextLabels xValues={[popH0Mean]} yValues={[max(popH0Y)]} labels={["H0"]} pos={3} faceColor={colorsH0.stat} />
   <TextLabels xValues={[popMean]} yValues={[max(popY)]} labels={["Reality"]} pos={3} faceColor={colorsPop.stat} />

</MeanPopulationPlot>

<!-- <DistributionPlot x={popX} f={popY} {title} {xLabel} {limX} {limY} lineColor={colorsPop.line} areaColor={colorsPop.area}
   crit={[popMean]} statColor="transparent" tail="both">

   <TextLegend textSize={1.15} x={85} y={max(f) * 1.55} pos={2} dx="1.30em" elements = {[
         "sample mean: " + sampMean.toFixed(2),
         "sample sd: " + sampSD.toFixed(2),
   ]} />

   <Segments xStart={[popMean]} xEnd={[popMean]} yStart={[0]} yEnd={[max(popY)]} lineColor={colorsPop.line} lineType={2} />

   <LineSeries xValues={popH0X} yValues={popH0Y} lineColor={colorsH0.line} />
   <AreaSeries xValues={popH0X} yValues={popH0Y} lineColor={"transparent"} fillColor={colorsH0.area} />
   <Segments xStart={[popH0Mean]} xEnd={[popH0Mean]} yStart={[0]} yEnd={[max(popY)]} lineColor={colorsH0.line} lineType={2} />

   <TextLabels xValues={[popH0Mean]} yValues={[max(popH0Y)]} labels={["H0"]} pos={3} faceColor={colorsH0.stat} />
   <TextLabels xValues={[popMean]} yValues={[max(popY)]} labels={["Reality"]} pos={3} faceColor={colorsPop.stat} />

   <ScatterSeries xValues={sample} yValues={sampY} borderWidth={2} markerSize={1.2} faceColor={"transparent"} borderColor={colorsPop.sample} />
   <Segments xStart={[sampMean]} xEnd={[sampMean]} yStart={[0]} yEnd={[max(popY)]} lineColor={colorsPop.sample} lineType={3} />

</DistributionPlot> -->
