<script>
   import { Vector, Index } from 'mdatools/arrays';
   import { Axes, XAxis, YAxis, Box, Segments, Points, TextLabels, Lines } from 'svelte-plots-basic/2d';

   export let x;
   export let y;
   export let limX;
   export let limY;
   export let mode;
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

   // compute position for labels
   $: pos = ys[0] < 0.08 ? 3 : 1;
</script>

<!-- control elements -->
<Axes title="CDF" xLabel={varName} yLabel="Probability, p" {limX} {limY} margins={[1, 1, 0.5, 0.5]}>

   <!-- CDF curve for the whole range -->
   <Lines lineColor={lineColor} lineWidth={2} xValues={x} yValues={y} />

   <!-- CDF curve for selected range -->
   <Lines lineWidth={2} xValues={xi} yValues={yi} lineColor={selectedLineColor} />

   <!-- horizontal line and text for probability for right point -->
   <Segments xStart={[xs[1]]} yStart={[limY[0]]} xEnd={[xs[1]]} yEnd={[ys[1]]} lineColor={selectedLineColor} />
   <Points xValues={[xs[1]]} yValues={[ys[1]]}  borderColor={selectedLineColor} faceColor={selectedLineColor} />
   <TextLabels xValues={[limX[0] + 15]} yValues={[ys[1]]} labels={ys[1].toFixed(3)} pos={3} faceColor={selectedLineColor} />

   <!-- corresponding vertical line-->
   <Segments xStart={[limX[0]]} yStart={[ys[1]]} xEnd={[xs[1]]} yEnd={[ys[1]]} lineColor={selectedLineColor} />

   {#if mode === 'Interval'}
      <!-- horizontal line and text for probability for right point -->
      <Segments xStart={[limX[0]]} yStart={[ys[0]]} xEnd={[xs[0]]} yEnd={[ys[0]]} lineColor={selectedLineColor} />
      <Points xValues={[xs[0]]} yValues={[ys[0]]}  borderColor={selectedLineColor} faceColor={selectedLineColor} />
      <TextLabels xValues={[limX[0] + 15]} yValues={[ys[0]]} labels={ys[0].toFixed(3)} pos={pos} faceColor={selectedLineColor} />

      <!-- corresponding vertical line-->
      <Segments xStart={[xs[0]]} yStart={[limY[0]]} xEnd={[xs[0]]} yEnd={[ys[0]]} lineColor={selectedLineColor} />
   {/if}

   <XAxis slot="xaxis" showGrid={true} ticks={xTicks} />
   <YAxis slot="yaxis" showGrid={true} />
   <Box slot="box" />
</Axes>

