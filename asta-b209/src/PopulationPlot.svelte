<script>
   import {seq, rep, mean, dnorm} from 'mdatools/stat';
   import {Axes, XAxis, YAxis, LineSeries,ScatterSeries, AreaSeries, Segments} from 'svelte-plots-basic';
   import { colors } from "../../shared/graasta";

   export let globalMean;
   export let effectExpected;
   export let noiseExpected ;
   export let samples;

   const mainColors = colors.plots.POPULATIONS;
   const areaColors = colors.plots.POPULATIONS_PALE;
   const sampColors = colors.plots.SAMPLES;

   const effectLineColor = "#606060";

   $: sampSize = samples[0].length;

   // parameters of sampel and population 1
   $: mu1 = globalMean - effectExpected / 2;
   $: x1 = seq(mu1 - 3.5 * noiseExpected, mu1 + 3.5 * noiseExpected, 100);
   $: f1 = dnorm(x1, mu1, noiseExpected);
   $: y1 = f1.map(v => v * 15);
   $: m1 = mean(samples[0]);

   // parameters of sample and population 2
   $: mu2 = globalMean + effectExpected / 2;
   $: x2 = seq(mu2 - 3.5 * noiseExpected, mu2 + 3.5 * noiseExpected, 100);
   $: f2 = dnorm(x2, mu2, noiseExpected);
   $: y2 = f2.map(v => 3 - v * 15);
   $: m2 = mean(samples[1]);
</script>

<Axes limX={[-0.2, 3.2]} limY={[20, 180]} xLabel="Temperature, ºC" yLabel="Yield, mg">
   <XAxis slot="xaxis" showGrid={true} ticks={[0, 3]} tickLabels={["120", "160"]}></XAxis>
   <YAxis slot="yaxis" showGrid={true}></YAxis>

    <!-- PDF  for population 1 -->
   <LineSeries xValues={y1} yValues={x1} lineColor={mainColors[0]}></LineSeries>
   <AreaSeries xValues={y1} yValues={x1} fillColor={areaColors[0]} lineColor="transparent"/>

    <!-- line for mu1 -->
   <Segments xStart={[0]} xEnd={[1.49]} yStart={[mu1]} yEnd={[mu1]} lineType={2} lineColor={sampColors[0]} />
   <ScatterSeries xValues={[1.49]} yValues={[mu1]} faceColor={sampColors[0]} borderColor="transparent" />

    <!-- sample points for population 1 -->
   <ScatterSeries xValues={rep(-0, sampSize)} yValues={samples[0]} borderColor={sampColors[0]} borderWidth={2} markerSize={1.3} faceColor="transparent" />

    <!-- PDF  for population 2 -->
   <LineSeries xValues={y2} yValues={x2} lineColor={mainColors[1]}></LineSeries>
   <AreaSeries xValues={y2} yValues={x2} fillColor={areaColors[1]} lineColor="transparent"/>

    <!-- line for mu2 -->
   <Segments xStart={[1.51]} xEnd={[3]} yStart={[mu2]} yEnd={[mu2]} lineType={2} lineColor={sampColors[1]} />
   <ScatterSeries xValues={[1.51]} yValues={[mu2]} faceColor={sampColors[1]} borderColor="transparent" />

    <!-- sample points for population 2 -->
   <ScatterSeries xValues={rep(3, sampSize)} yValues={samples[1]} borderColor={sampColors[1]} borderWidth={2} markerSize={1.3} faceColor="transparent" />

    <!-- line fo observed effect -->
   <Segments xStart={[0]} xEnd={[3]} yStart={[m1]} yEnd={[m2]} lineWidth={1.5} lineColor="{effectLineColor}" />
   <ScatterSeries xValues={[0]} yValues={[m1]} borderColor={effectLineColor} markerSize={1} faceColor={effectLineColor} />
   <ScatterSeries xValues={[3]} yValues={[m2]} borderColor={effectLineColor} markerSize={1} faceColor={effectLineColor} />
</Axes>
