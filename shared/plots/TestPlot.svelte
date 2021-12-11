<script>
   import {mrange, max} from "stat-js";
   import {TextLegend} from "svelte-plots-basic";

   // graasta shared components
   import DistributionPlot from '../../shared/plots/DistributionPlot.svelte';
   import { formatLabels } from "../../shared/graasta.js";

   export let x;
   export let f;
   export let crit;
   export let tail;
   export let pValue;
   export let alpha;
   export let xLabel;
   export let clicked;

   export let showLegend = true;
   export let H0LegendStr = "";

   export let reset = false;
   export let limX = mrange(x, 0.1);
   export let limY = null;

   export let mainColor = "#000000";
   export let testFailColor = "#ff2211";

   let nSamples = 0;
   let nSamplesBelowAlpha = 0;

   $: lineColor = pValue < alpha ? testFailColor : mainColor;
   $: areaColor = lineColor + "40";
   $: statColor = lineColor + "90";

   $: limYLocal = limY === null ? [0, max(f) * (showLegend ? 1.45 : 1.2)] : limY;

   // cumulative statistics
   $: {
      clicked;

      // reset statistics if sample size, population proportion or a test tail has been changed
      if (reset) {
         nSamples = 0;
         nSamplesBelowAlpha = 0;
      }

      // count number of samples taken for the same test conditions and how many have p-value < 0.05
      nSamples = nSamples + 1;
      nSamplesBelowAlpha = nSamplesBelowAlpha + (pValue < alpha);
   }

   // text values for stat table
   $: labelsStr = formatLabels([
      {
         name: H0LegendStr + ", p",
         value: `<tspan ${pValue < alpha ? "fill=" + testFailColor : ""}>${pValue.toFixed(3)}</tspan>`
      },
      {
         name: `# samples with p < ${alpha}`,
         value:  `${nSamplesBelowAlpha}/${nSamples} (${(100 * nSamplesBelowAlpha/nSamples).toFixed(1)}%)`
      }
   ]);
</script>

<!-- plot with population based CI and position of current sample proportion -->
<DistributionPlot {x} {f} {xLabel} {crit} {tail} {lineColor} {areaColor} {statColor} {limX} limY={limYLocal} >
   <slot></slot>
   <slot name="legend">
   {#if showLegend}
      <TextLegend textSize={1.15} left={limX[0]} top={max(f) * 1.35} dx="1.5em" dy="1.35em" elements={labelsStr} />
   {/if}
   </slot>
</DistributionPlot>


