<script>
   import { mean } from "stat-js";
   import {Axes, XAxis, YAxis, Box, Segments, AreaSeries, TextLabels, Colors, LineSeries} from "svelte-plots-basic";

   export let x;
   export let y;
   export let p;
   export let limX;
   export let limY;
   export let intInd;
   export let varName;

   $: xs = [x[intInd[0]], x[intInd[1]]];
   $: ys = [y[intInd[0]], y[intInd[1]]];
   $: xi = x.filter( (v, i) => i >= intInd[0] & i <= intInd[1]);
   $: yi = y.filter( (v, i) => i >= intInd[0] & i <= intInd[1]);
</script>

<!-- control elements -->
<Axes title="PDF" xLabel={varName} yLabel="Density" {limX} {limY}>
   <XAxis slot="xaxis" showGrid={true}></XAxis>
   <YAxis slot="yaxis" showGrid={true}></YAxis>
   <Box slot="box"></Box>

   <LineSeries lineColor="#909090" lineWidth={2} xValues={x} yValues={y} />
   <Segments xStart={xs} yStart={[0, 0]} xEnd={xs} yEnd={ys} />
   <LineSeries lineWidth={2} xValues={xi} yValues={yi} />
   <AreaSeries lineWidth={2} xValues={xi} yValues={yi} opacity={0.25}/>
   <TextLabels xValues={[mean(xs)]} yValues={[0]} labels={[p.toFixed(3)]} faceColor={Colors.PRIMARY} pos={3} />
</Axes>
