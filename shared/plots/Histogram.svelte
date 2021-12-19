<script>
   import { BarSeries} from 'svelte-plots-basic';
   import { count, sum, mids, split } from 'mdatools/stat';

   export let values = [];
   export let nBins = 10;
   export let faceColor = "#a0a0a0";
   export let borderColor = faceColor;
   export let barWidth = 1;
   export let freq = true;

   // these can be provided directly by user instead of x and y values
   export let bins = undefined;
   export let counts = undefined;

   let xValues, yValues

   $: {
      if ((bins === undefined || counts === undefined) && (!Array.isArray(values) || values.length === 0)) {
         throw("Histogram: either vector with values or vectors with bins and counts must be provided.");
      }

      if ((counts !== undefined) && bins.length !== (counts.length + 1)) {
         throw("Histogram: number of values in 'counts' should be by one smaller than number of values in 'bins'");
      }

      const b = bins === undefined ? split(values, nBins) : bins;
      xValues = mids(b);
      yValues = counts === undefined ? count(values, b) : counts;

      // compute densities instead of counts if required
      if (freq === false) {
         const n = sum(yValues);
         const bw = b[1] - b[0];
         yValues = yValues.map(v => (v / n) / bw);
      }
   }
</script>

<BarSeries
   {xValues}
   {yValues}
   {barWidth}
   {faceColor}
   {borderColor}
/>

