<script>
   import {Rectangles, Segments, TextLabels} from 'svelte-plots-basic';
   import {min, max, quantile, getOutliers} from 'stat-js';
import { getContext } from 'svelte';

   export let values = [];
   export let boxPosition;
   export let boxSize = boxPosition * 0.05;
   export let horizontal = false;
   export let faceColor = "white";
   export let borderColor = "blue";
   export let lineWidth = 1;

   // can be provided by user or computed based on values
   export let quartiles = [];
   export let outliers = [];
   export let range = [];

   // coordinates of box, range segments and outliers
   let bl, bw, bh, bt;
   let xs, xe, ys, ye;
   let px, py;

   // to access shared parameters and methods from Axes
   const axes = getContext('axes');

   // compute quartiles and IQR
   $: Q1 = quartiles.length === 3 ? quartiles[0] : quantile(values, 0.25);
   $: Q2 = quartiles.length === 3 ? quartiles[1] : quantile(values, 0.50);
   $: Q3 = quartiles.length === 3 ? quartiles[2] : quantile(values, 0.75);
   $: IQR = Q3 - Q1;
   $: out = values.length === 0 ? outliers : getOutliers(values, Q1, Q3);
   $: outFreeValues = out.length > 0 ? values.filter(v => !out.some(o => o == v)) : values;
   $: mn = range.length === 2 ? range[0] : min(outFreeValues);
   $: mx = range.length === 2 ? range[1] : max(outFreeValues);

   $: {
      if (horizontal === true) {
         bl = Q1;
         bt = boxPosition + boxSize/2;
         bw = IQR;
         bh = boxSize;
         xs = [mn < Q1 ? mn : Q1, Q3, Q2];
         xe = [Q1, mx > Q3 ? mx : Q3, Q2];
         ys = [boxPosition, boxPosition, bt];
         ye = [boxPosition, boxPosition, bt - bh];
         px = out;
         py = Array(out.length).fill(boxPosition);

         // correct axis limits
         const xLimMin = min(out.concat([mn]));
         const xLimMax = max(out.concat([mx]));
         const dXLim = (xLimMax - xLimMin) * 0.05;
         axes.adjustXAxisLimits([xLimMin - dXLim, xLimMax + dXLim]);
         axes.adjustYAxisLimits([boxPosition - boxSize/(1.5), boxPosition + boxSize/(1.5)]);

      } else {
         bl = boxPosition - boxSize/2;
         bt = Q3;
         bw = boxSize;
         bh = IQR;
         ys = [mn < Q1 ? mn : Q1, Q3, Q2];
         ye = [Q1, mx > Q3 ? mx : Q3, Q2];
         xs = [boxPosition, boxPosition, bl];
         xe = [boxPosition, boxPosition, bl + bw];
         py = out;
         px = Array(out.length).fill(boxPosition);

         // correct axis limits
         const yLimMin = min(out.concat([mn]));
         const yLimMax = max(out.concat([mx]));
         const dYLim = (yLimMax - yLimMin) * 0.05;
         axes.adjustYAxisLimits([yLimMin - dYLim, yLimMax + dYLim]);
         axes.adjustXAxisLimits([boxPosition - boxSize/(1.5), boxPosition + boxSize/(1.5)]);

      }
   }
</script>

<Rectangles
   left={[bl]}
   top={[bt]}
   width={[bw]}
   height="{[bh]}"
   {lineWidth}
   {faceColor}
   {borderColor}
/>
<Segments xStart="{xs}" xEnd={xe} yStart={ys} yEnd={ye} {lineWidth} lineColor={borderColor} />
{#if out.length > 0}
<TextLabels xValues="{px}" yValues="{py}" labels="●" {faceColor} {borderColor} borderWidth={lineWidth} />
{/if}
