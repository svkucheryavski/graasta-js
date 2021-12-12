<script>
   import {ppoints, sd, seq, pnorm, qnorm, skewness, kurtosis, mean, quantile, diff, mrange, sort} from "stat-js";
   import {Axes, XAxis, YAxis, Box, LineSeries, ScatterSeries} from "svelte-plots-basic";
   import { colors } from "../../shared/graasta";

   export let sample;

   export let borderColor = colors.plots.SAMPLES[0];
   export let lineColor = colors.plots.SAMPLES[0];
   export let markerSize = 1.25;
   export let borderWidth = 2;

   export let lineType = 2;
   export let xLabel = "Sample values";
   export let yLabel = "Normal quantiles, z";

   export let limX = undefined;
   export let limY = undefined;


   $: sx = sort([].concat.apply([], sample));
   $: sampSize = sx.length;
   $: sp = ppoints(sampSize);
   $: sz = sp.map(v => qnorm(v));

   // theoretical line
   const lp = [0.25, 0.75];
   const lz = [-0.6744898,  0.6744898];

   $: lx = quantile(sx, lp);
   $: la = diff(lx) / diff(lz);
   $: lb = mean(lx) - la * mean(lz)
   $: llx = [-4, 4];
   $: lly = [-4 * la + lb, 4 * la + lb];
</script>

<Axes {yLabel} {xLabel} limX={limX ? limX : mrange(sz)} limY={limY ? limY : mrange(sx)}>
   <slot></slot>
   <LineSeries xValues={llx} yValues={lly} {lineType} {lineColor} />
   <ScatterSeries xValues={sz} yValues={sx} {borderWidth} {markerSize} {borderColor}/>

   <XAxis slot="xaxis" showGrid={true}></XAxis>
   <YAxis slot="yaxis" showGrid={true}></YAxis>
   <Box slot="box"></Box>
</Axes>
