<script>
   import {Axes, XAxis, YAxis, Box, Segments, ScatterSeries, Colors, TextLabels, LineSeries} from "svelte-plots-basic";

   export let x;
   export let y;
   export let limX;
   export let limY;
   export let mode;
   export let intInd;
   export let varName;

   // coordinates of end points of the interval
   $: xs = [x[intInd[0]], x[intInd[1]]];
   $: ys = [y[intInd[0]], y[intInd[1]]];

   // coordinates of points between the end points
   $: xi = x.filter( (v, i) => i >= intInd[0] & i <= intInd[1]);
   $: yi = y.filter( (v, i) => i >= intInd[0] & i <= intInd[1]);

   // position of label for p1
   $: pos = xs[0] < limX[0] + 15 ? 3 : 1;
</script>

<!-- control elements -->
<Axes title="Inverse CDF" xLabel="Probability" yLabel={varName} limX={limY} limY={limX} >

   <XAxis slot="xaxis" showGrid={true}></XAxis>
   <YAxis slot="yaxis" showGrid={true}></YAxis>
   <Box slot="box"></Box>

   <!-- the gray curve with ICDF -->
   <LineSeries lineColor="#909090" lineWidth={2} xValues={y} yValues={x} />

   <!-- the horizontal and vertical lines with current x2 and p2 -->
   <Segments xStart={[ys[1]]} yStart={[limX[0]]} xEnd={[ys[1]]} yEnd={[xs[1]]} />
   <Segments xStart={[limY[0]]} yStart={[xs[1]]} xEnd={[ys[1]]} yEnd={[xs[1]]} />

   <!-- the blue line with CDF between the selected points and the markers on the ends -->
   <LineSeries lineWidth={2} xValues={yi} yValues={xi} />
   <ScatterSeries xValues={[ys[1]]} yValues={[xs[1]]}  faceColor={Colors.PRIMARY} />

   <!-- text with p2 values -->
   <TextLabels xValues={[limY[0] + 0.1]} yValues={[xs[1]]} labels={xs[1].toFixed(1)} pos={3} faceColor={Colors.PRIMARY} />

   {#if mode === "Interval"}
      <!-- same elements as above but for x1 and p1 -->
      <Segments xStart={[ys[0]]} yStart={[limX[0]]} xEnd={[ys[0]]} yEnd={[xs[0]]} />
      <Segments xStart={[limY[0]]} yStart={[xs[0]]} xEnd={[ys[0]]} yEnd={[xs[0]]} />
      <LineSeries lineWidth={2} xValues={yi} yValues={xi} />
      <ScatterSeries xValues={[ys[0]]} yValues={[xs[0]]}  faceColor={Colors.PRIMARY} />
      <TextLabels xValues={[limY[0] + 0.1]} yValues={[xs[0]]} labels={xs[0].toFixed(1)} pos={pos} faceColor={Colors.PRIMARY} />
   {/if}
</Axes>

