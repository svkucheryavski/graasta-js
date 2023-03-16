<script>
   import { mean } from 'mdatools/stat';
   import { Vector, Index } from 'mdatools/arrays';
   import { Axes, XAxis, YAxis, Box, Segments, Area, TextLabels, Lines } from 'svelte-plots-basic/2d';

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

   // compute coordinates for the interval boundaries
   $: xs = [x.v[intInd[0]], x.v[intInd[1]]];
   $: ys = [y.v[intInd[0]], y.v[intInd[1]]];

   // compute coordinates of points inside the interval
   $: xi = x.subset(Index.seq(intInd[0] + 1, intInd[1] + 1));
   $: yi = y.subset(Index.seq(intInd[0] + 1, intInd[1] + 1));

   // add additional coordinates to make area plot
   $: xia = Vector.c(xi, xs[1]);
   $: yia = Vector.c(yi, [0]);
</script>

<!-- control elements -->
<Axes title="PDF" xLabel={varName} yLabel="Density" {limX} {limY} margins={[1, 1, 0.5, 0.5]}>

   <Lines lineColor={lineColor} lineWidth={2} xValues={x} yValues={y} />
   <Segments lineColor={selectedLineColor} xStart={xs} yStart={[0, 0]} xEnd={xs} yEnd={ys} />

   <Lines lineColor={selectedLineColor} lineWidth={2} xValues={xi} yValues={yi} />
   <Area fillColor={selectedLineColor} lineColor="transparent" lineWidth={2} xValues={xia} yValues={yia} opacity={0.35}/>
   <TextLabels faceColor={selectedLineColor} xValues={[mean(xs)]} yValues={[0]} labels={[p.toFixed(3)]} pos={3} />

   <XAxis slot="xaxis" showGrid={true} ticks={xTicks}></XAxis>
   <YAxis slot="yaxis" showGrid={true}></YAxis>
   <Box slot="box"></Box>
</Axes>
