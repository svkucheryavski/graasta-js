<script>
   import {mean} from "stat-js"
   import {Axes, XAxis, YAxis, Box, Segments, ScatterSeries, Colors, TextLabels, AreaSeries, LineSeries} from "svelte-plots-basic";

   export let x;
   export let y;
   export let limX;
   export let limY;
   export let mode;
   export let intInd;
   export let varName;

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

   <LineSeries lineColor="#909090" lineWidth={2} xValues={x} yValues={y} />
   <Segments xStart={[xs[1]]} yStart={[limY[0]]} xEnd={[xs[1]]} yEnd={[ys[1]]} />
   <Segments xStart={[limX[0]]} yStart={[ys[1]]} xEnd={[xs[1]]} yEnd={[ys[1]]} />
   <LineSeries lineWidth={2} xValues={xi} yValues={yi} />

   <ScatterSeries xValues={[xs[1]]} yValues={[ys[1]]}  faceColor={Colors.PRIMARY} />
   <TextLabels xValues={[limX[0] + 15]} yValues={[ys[1]]} labels={ys[1].toFixed(4)} pos={3} faceColor={Colors.PRIMARY} />

   {#if mode === "Interval"}
   <Segments xStart={[xs[0]]} yStart={[limY[0]]} xEnd={[xs[0]]} yEnd={[ys[0]]} />
   <Segments xStart={[limX[0]]} yStart={[ys[0]]} xEnd={[xs[0]]} yEnd={[ys[0]]} />
   <LineSeries lineWidth={2} xValues={xi} yValues={yi} />
   <ScatterSeries xValues={[xs[0]]} yValues={[ys[0]]}  faceColor={Colors.PRIMARY} />
   <TextLabels xValues={[limX[0] + 15]} yValues={[ys[0]]} labels={ys[0].toFixed(3)} pos={pos} faceColor={Colors.PRIMARY} />
   {/if}
</Axes>

