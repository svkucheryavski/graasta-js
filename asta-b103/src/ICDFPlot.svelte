<script>
   import { Index } from 'mdatools/arrays';
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

   // coordinates of end points of the interval
   $: xs = [x.v[intInd[0]], x.v[intInd[1]]];
   $: ys = [y.v[intInd[0]], y.v[intInd[1]]];

   // coordinates of points between the end points
   $: xi = x.subset(Index.seq(intInd[0] + 1, intInd[1] + 1));
   $: yi = y.subset(Index.seq(intInd[0] + 1, intInd[1] + 1));

   // position of label for p1
   $: pos = xs[0] < limX[0] + 15 ? 3 : 1;
</script>

<!-- control elements -->
<Axes title="Inverse CDF" xLabel="Probability" yLabel={varName} limX={limY}
   limY={[limX[0], limX[1]+10]} margins={[1, 1, 0.5, 0.5]}>


   <!-- the gray curve with ICDF -->
   <Lines lineWidth={2} xValues={y} yValues={x} lineColor={lineColor} />

   <!-- the horizontal and vertical lines with current x2 and p2 -->
   <Segments xStart={[ys[1]]} yStart={[limX[0]]} xEnd={[ys[1]]} yEnd={[xs[1]]} lineColor={selectedLineColor} />
   <Segments xStart={[limY[0]]} yStart={[xs[1]]} xEnd={[ys[1]]} yEnd={[xs[1]]} lineColor={selectedLineColor} />

   <!-- the blue line with CDF between the selected points and the markers on the ends -->
   <Lines lineWidth={2} xValues={yi} yValues={xi} lineColor={selectedLineColor} />
   <Points xValues={[ys[1]]} yValues={[xs[1]]} borderColor={selectedLineColor} faceColor={selectedLineColor} />

   <!-- text with p2 values -->
   <TextLabels xValues={[limY[0] + 0.1]} yValues={[xs[1]]} labels={xs[1].toFixed(1)} pos={3} faceColor={selectedLineColor} />

   {#if mode === "Interval"}
      <!-- same elements as above but for x1 and p1 -->
      <Segments xStart={[ys[0]]} yStart={[limX[0]]} xEnd={[ys[0]]} yEnd={[xs[0]]} lineColor={selectedLineColor} />
      <Segments xStart={[limY[0]]} yStart={[xs[0]]} xEnd={[ys[0]]} yEnd={[xs[0]]} lineColor={selectedLineColor} />
      <Points xValues={[ys[0]]} yValues={[xs[0]]}  faceColor={selectedLineColor} borderColor={selectedLineColor} />
      <TextLabels xValues={[limY[0] + 0.1]} yValues={[xs[0]]} labels={xs[0].toFixed(1)} pos={pos} faceColor={selectedLineColor} />
   {/if}

   <XAxis slot="xaxis" showGrid={true} />
   <YAxis slot="yaxis" showGrid={true} />
   <Box slot="box" />
</Axes>

