<script>
   import { mean } from 'mdatools/stat';
   import {Axes, XAxis, YAxis, Box, Segments, AreaSeries, TextLabels, LineSeries} from "svelte-plots-basic";

   export let x;
   export let y;
   export let p;
   export let limX;
   export let limY;
   export let intInd;
   export let varName;
   export let lineColor;
   export let selectedLineColor;
   export let xTicks;

   $: xs = [x[intInd[0]], x[intInd[1]]];
   $: ys = [y[intInd[0]], y[intInd[1]]];
   $: xi = x.filter( (v, i) => i >= intInd[0] & i <= intInd[1]);
   $: yi = y.filter( (v, i) => i >= intInd[0] & i <= intInd[1]);
</script>

<!-- control elements -->
<Axes title="PDF" xLabel={varName} yLabel="Density" {limX} {limY}>
   <XAxis slot="xaxis" showGrid={true} ticks={xTicks}></XAxis>
   <YAxis slot="yaxis" showGrid={true}></YAxis>
   <Box slot="box"></Box>

   <LineSeries lineColor={lineColor} lineWidth={2} xValues={x} yValues={y} />
   <Segments lineColor={selectedLineColor} xStart={xs} yStart={[0, 0]} xEnd={xs} yEnd={ys} />

   <LineSeries lineColor={selectedLineColor} lineWidth={2} xValues={xi} yValues={yi} />
   <AreaSeries fillColor={selectedLineColor} lineColor="transprent" lineWidth={2} xValues={xi} yValues={yi} opacity={0.35}/>
   <TextLabels faceColor={selectedLineColor} xValues={[mean(xs)]} yValues={[0]} labels={[p.toFixed(3)]} pos={3} />
</Axes>
