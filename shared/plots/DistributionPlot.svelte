<script>
   import { closestind } from 'mdatools/misc';
   import { max, mrange } from 'mdatools/stat';
   import { Index, vector, c } from 'mdatools/arrays';

   import { Axes, XAxis, Lines, Area, Segments } from 'svelte-plots-basic/2d';

   export let lineColor = '#000000';
   export let areaColor = lineColor + '40';
   export let statColor = '#000000';

   export let x;
   export let f;
   export let crit = [];
   export let tail = 'left';

   export let limX = mrange(x, 0.1);
   export let limY = [0, max(f) * 1.2];
   export let xLabel = '';
   export let yLabel = undefined;
   export let title = null;

   let axLeft = [], axRight = [], afLeft = [], afRight = [];
   let cxInd, cx, cf;

   $: {
      cxInd = crit.map(v => closestind(x, v));
      if (cxInd.length > 0) {
         cx = x.subset(cxInd);
         cf = f.subset(cxInd);

         if ((tail === 'left' || tail === 'both') && cxInd.length > 0 && cxInd[0] >= 1) {
            const indLeft = Index.seq(1, cxInd[0]);
            const ni = indLeft.length;
            axLeft = c(vector([x.v[indLeft.v[0] - 1]]), x.subset(indLeft), vector([x.v[indLeft.v[ni - 1] - 1]]));
            afLeft = c(vector([0]), f.subset(indLeft), vector([0]));
         }

         if ((tail === 'right' || tail === 'both') && cxInd.length > 0) {
            const indRight = Index.seq(cxInd.length > 1 ? cxInd[1] : cxInd[0], x.length);
            const ni = indRight.length;
            axRight = c(vector([x.v[indRight.v[0] - 1]]), x.subset(indRight), vector([x.v[indRight.v[ni - 1] - 1]]));
            afRight = c(vector([0]), f.subset(indRight), vector([0]));
         }
      }
   }
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes {limX} {limY} {xLabel} {yLabel} {title} margins={[0.5, 0.05, 0.05, 0.05]}>
   <slot name="box"></slot>

   <!-- legend with statistics -->
   <slot name="legend"></slot>

   <!-- area for left tail -->
   {#if axLeft && axLeft.length > 1 && (tail === "left" || tail === "both")}
      <Area xValues={axLeft} yValues={afLeft} lineColor="transparent" fillColor={areaColor}/>
   {/if}

   <!-- area for right tail -->
   {#if axRight !== undefined && axRight.length > 1 && (tail === "right" || tail === "both")}
      <Area xValues={axRight} yValues={afRight} lineColor="transparent" fillColor={areaColor}/>
   {/if}

   <!-- distribution curve -->
   <Lines xValues={x} yValues={f} lineColor={lineColor} />

   <!-- critical values -->
   {#if cx.length > 0}
   <Segments xStart={cx} xEnd={cx} yStart={vector([0]).rep(cf.length)} yEnd={cf} lineColor={statColor} />
   {/if}

   <slot></slot>
   <slot name="yaxis"></slot>
   <XAxis slot="xaxis" ></XAxis>
</Axes>

