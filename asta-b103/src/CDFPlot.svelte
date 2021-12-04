<script>
   import {Axes, XAxis, YAxis, Box, Segments, ScatterSeries, TextLabels, LineSeries} from "svelte-plots-basic";

   export let x;
   export let y;
   export let limX;
   export let limY;
   export let mode;
   export let intInd;
   export let varName;
   export let lineColor;
   export let selectedLineColor;

   $: xs = [x[intInd[0]], x[intInd[1]]];
   $: ys = [y[intInd[0]], y[intInd[1]]];
   $: xi = x.filter( (v, i) => i >= intInd[0] & i <= intInd[1]);
   $: yi = y.filter( (v, i) => i >= intInd[0] & i <= intInd[1]);
   $: pos = ys[0] < 0.08 ? 3 : 1;
</script>

<!-- control elements -->
<Axes title="CDF" xLabel={varName} yLabel="Probability, p" {limX} {limY} >
   <XAxis slot="xaxis" showGrid={true}></XAxis>
   <YAxis slot="yaxis" showGrid={true}></YAxis>
   <Box slot="box"></Box>

   <!-- CDF curve for the whole range -->
   <LineSeries lineColor={lineColor} lineWidth={2} xValues={x} yValues={y} />

   <!-- CDF curve for selected range -->
   <LineSeries lineWidth={2} xValues={xi} yValues={yi} lineColor={selectedLineColor} />

   <!-- horizontal line and text for probability for right point -->
   <Segments xStart={[xs[1]]} yStart={[limY[0]]} xEnd={[xs[1]]} yEnd={[ys[1]]} lineColor={selectedLineColor} />
   <ScatterSeries xValues={[xs[1]]} yValues={[ys[1]]}  borderColor={selectedLineColor} faceColor={selectedLineColor} />
   <TextLabels xValues={[limX[0] + 15]} yValues={[ys[1]]} labels={ys[1].toFixed(4)} pos={3} faceColor={selectedLineColor} />

   <!-- corresponding vertical line-->
   <Segments xStart={[limX[0]]} yStart={[ys[1]]} xEnd={[xs[1]]} yEnd={[ys[1]]} lineColor={selectedLineColor} />

   {#if mode === "Interval"}
      <!-- horizontal line and text for probability for right point -->
      <Segments xStart={[limX[0]]} yStart={[ys[0]]} xEnd={[xs[0]]} yEnd={[ys[0]]} lineColor={selectedLineColor} />
      <ScatterSeries xValues={[xs[0]]} yValues={[ys[0]]}  borderColor={selectedLineColor} faceColor={selectedLineColor} />
      <TextLabels xValues={[limX[0] + 15]} yValues={[ys[0]]} labels={ys[0].toFixed(4)} pos={pos} faceColor={selectedLineColor} />

      <!-- corresponding vertical line-->
      <Segments xStart={[xs[0]]} yStart={[limY[0]]} xEnd={[xs[0]]} yEnd={[ys[0]]} lineColor={selectedLineColor} />
   {/if}
</Axes>

