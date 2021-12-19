<script>
   import { max, mrange, subset, seq, rep, closestIndex } from "mdatools/stat";
   import { Axes, XAxis, LineSeries, AreaSeries, Segments } from "svelte-plots-basic";

   export let lineColor = "#000000";
   export let areaColor = lineColor + "40";
   export let statColor = "#000000";

   export let x;
   export let f;
   export let crit = [];
   export let tail = "left";

   export let limX = mrange(x, 0.1);
   export let limY = [0, max(f) * 1.2];
   export let xLabel = "";
   export let yLabel = undefined;
   export let title = null;

   let axLeft = [], axRight = [], afLeft = [], afRight = [];
   let cxInd, cx, cf;

   $: {
      cxInd = crit.map(v => closestIndex(x, v) + 1);

      cx = subset(x, cxInd);
      cf = subset(f, cxInd);

      if (tail === "left" || tail === "both") {
         const indLeft = cxInd[0] >= 1 ? seq(1, (cxInd[0])) : [];
         axLeft = subset(x, indLeft);
         afLeft = subset(f, indLeft);
      }

      if (tail === "right" || tail === "both") {
         const indRight = seq((cxInd.length > 1 ? cxInd[1] : cxInd[0]), x.length);
         axRight = subset(x, indRight);
         afRight = subset(f, indRight);
      }
   }
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes {limX} {limY} {xLabel} {yLabel} {title}>
   <slot name="box"></slot>

   <!-- legend with statistics -->
   <slot name="legend"></slot>

   <!-- area for left tail -->
   {#if axLeft && axLeft.length > 1 && (tail === "left" || tail === "both")}
      <AreaSeries xValues={axLeft} yValues={afLeft} lineColor="transparent" fillColor={areaColor}/>
   {/if}

   <!-- area for right tail -->
   {#if axRight !== undefined && axRight.length > 1 && (tail === "right" || tail === "both")}
      <AreaSeries xValues={axRight} yValues={afRight} lineColor="transparent" fillColor={areaColor}/>
   {/if}

   <!-- distribution curve -->
   <LineSeries xValues={x} yValues={f} lineColor={lineColor} />

   <!-- critical values -->
   {#if cx.length > 0}
   <Segments xStart={cx} xEnd={cx} yStart={rep(0, cf.length)} yEnd={cf} lineColor={statColor} />
   {/if}

   <slot></slot>
   <slot name="yaxis"></slot>
   <XAxis slot="xaxis" ></XAxis>
</Axes>

