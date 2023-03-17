<script>
   // misc from mdatools
   import { range, quantile, mean, min, max } from 'mdatools/stat';
   import { Vector } from 'mdatools/arrays';

   // shared components - app
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';

   // local components
   import Plot from './AppPlot.svelte';
   import DataTable from './AppDataTable.svelte';
   import StatTable from './AppStatTable.svelte';

   const sampleSize = 12;
   const popMean = 110;
   const popStd = 5;

   let minRange = [0, 0];
   let maxRange = [0, 0];

   /**
    * Take n randomly distributed values as a sample and adjust min and max range limits for controls
    * @param {number} n - sample size.
    *
    * @return {Vector} vector with sample values.
    */
   function getSample(n) {
      // take random normally distributed values and sort them
      let values = Vector.randn(n, popMean, popStd).sort();

      // half of the range of the values
      const rn = range(values);
      const dv = (rn[1] - rn[0]) * 0.5;

      // compute range for min and max controllers
      minRange = [values.v[0] - dv, values.v[1] - (values.v[1] - values.v[0]) * 0.10];
      maxRange = [values.v[n - 2] + (values.v[n - 1] - values.v[n - 2]) * 0.10, values.v[n - 1] + dv];

      return values;
   }

   /**
    * Compute main statistics.
    *
    * @param {Vector} values - vector with sample values.
    *
    * @return {Objects} JSON with main statistics.
    */
   function getstats(values) {

      // return object with ranks, values and percentiles
      const Q1 = quantile(values, 0.25);
      const Q2 = quantile(values, 0.50);
      const Q3 = quantile(values, 0.75);
      const IQR = Q3 - Q1;

      return {
         range: range(values.filter(v => v >= Q1 - 1.5 * IQR && v <= Q3 + 1.5 * IQR)),
         quartiles: [Q1, Q2, Q3],
         mean: mean(values),
         min: min(values),
         max: max(values),
         outliers: values.filter(v => v < Q1 - 1.5 * IQR || v > Q3 + 1.5 * IQR)
      }
   }

   $: sample = getSample(sampleSize);
   $: stats = getstats(sample);
</script>

<StatApp>
   <div class="app-layout">

      <!-- plot with data points, box and whiskers, statistics and limits -->
      <div class="app-plot-area">
         <Plot {sample} {stats} />
      </div>

      <!-- table with values, ranks and percentages -->
      <div class="app-datatable-area">
         <DataTable {sample} />
      </div>

      <!-- table with statistics -->
      <div class="app-stattable-area">
         <StatTable {stats} />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlRange id="min" label="Change min:" step={0.1} bind:value={sample.v[0]}
               min={minRange[0]} max={minRange[1]} />
            <AppControlRange id="max" label="Change max:" step={0.1} bind:value={sample.v[sampleSize - 1]}
               min={maxRange[0]} max={maxRange[1]} />
            <AppControlButton id="getsample" label="Sample:" text="Take new"
               on:click={() => sample = getSample(sampleSize)} />
         </AppControlArea>
      </div>
   </div>

   <div slot="help">
      <h2>Quantiles, quartiles, percentiles</h2>
      <p>
         This app shows calculation of main non-parametric descriptive statistics: <i>min</i>, <i>max</i>, <i>quartiles</i> and
         <i>percentiles</i>. The plot contains current sample values as points and the traditional box and whiskers plot. The dashed line inside the box shows the mean. The red elements represent boundaries for detection of outliers (based on ±1.5IQR rule).
      </p>
      <p>
         Try to change the smallest (<i>min</i>) or the largest (<i>max</i>) values of your current sample using the sliders in order to see what happens to the boxplot if one of the values will be outside the boundaries. You can also pay attention which statistics are changing and which remain stable in this case.
      </p>
      <p>
         The table in the bottom shows the current values (<i>x</i>) ordered from smallest to largest, their rank (<i>i</i>), as well as their percentiles (<i>p</i>) also known as <em>sample quantiles</em>. The percentiles are computed using <code>(i - 0.5)/n</code> rule. The table on the right side shows the computed statistics.
      </p>
   </div>
</StatApp>

<style>

.app-layout {
   min-width: 800px;
   width: 100%;
   height: 100%;
   position: relative;
   display: grid;
   grid-template-areas:
      "plot stattable"
      "plot controls"
      "plot ."
      "datatable .";
   grid-template-columns: auto min(400px, 35%);
   grid-template-rows: min-content auto auto min-content;
}


.app-plot-area {
   grid-area: plot;
   box-sizing: border-box;
   padding-right: 10px;
   padding-bottom: 20px;
}

.app-datatable-area {
   grid-area: datatable;
   padding-right: 10px;
   padding-top: 10px;
}

.app-stattable-area {
   grid-area: stattable;
   padding-left: 10px;
   padding-bottom: 20px;
}

.app-controls-area {
   grid-area: controls;
}

:global(.datatable) {
   width: 100%;
   color: #404040;
   text-align: right;
}


.app-datatable-area :global(.datatable > tr:first-of-type) {
   border-bottom: solid 1px #e0e0e0;
}

.app-datatable-area :global(.datatable > tr > .datatable__value) {
   font-size: 1em;
   color: #606060;
}

.app-datatable-area :global(.datatable > tr:nth-of-type(2) > .datatable__value) {
   color: #336688;
}

.app-datatable-area :global(.datatable > tr:nth-of-type(2) > td:nth-of-type(2)),
.app-datatable-area :global(.datatable > tr:nth-of-type(2) > td:last-of-type) {
   font-weight: bold;
   color: #336688;
}

.app-stattable-area :global(.datatable > tr) {
   border-bottom: solid 1px #e0e0e0;
}

.app-stattable-area :global(.datatable > tr:first-of-type) {
   border-top: solid 1px #e0e0e0;
}

.app-stattable-area :global(.datatable__label ) {
   text-align: left;
}
</style>