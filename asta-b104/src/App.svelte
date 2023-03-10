<script>
   import { qnorm } from 'mdatools/distributions';
   import { ppoints, sd, skewness, kurtosis, mean } from 'mdatools/stat';
   import { Vector } from 'mdatools/arrays';
   import { Lines } from 'svelte-plots-basic/2d';
   import { QQPlot } from 'mdatools-plots/stat';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';
   import { colors } from '../../shared/graasta';

   // shared components - contrls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // shared tables
   import DataTable from '../../shared/tables/DataTable.svelte';

   let showPopLine = 'off';
   let sampleSize = 6;

   const yLabel = 'Height, cm';
   const xLabel = 'Standard score, z';
   const sampleColor = colors.plots.SAMPLES[0];
   const populationColor = colors.plots.POPULATIONS[0];

   const popMean = 170;
   const popStd = 10;
   const limX = [-3.5, 3.5];
   const limY = [popMean - 3.5 * popStd, popMean + 3.5 * popStd];

   const getSample = function(n) {
      return Vector.randn(n, popMean, popStd).sort();
   }

   $: si = Vector.seq(1, sampleSize);
   $: sp = ppoints(sampleSize);
   $: sz = qnorm(sp);
   $: sx = getSample(sampleSize);
</script>

<StatApp>
   <div class="app-layout">

      <!-- QQ plot with corresponding data  -->
      <div class="app-qqplot-area">
         <QQPlot {limX} {limY} values={sx} lineColor={sampleColor} borderColor={sampleColor} {xLabel} {yLabel} >
            {#if showPopLine === 'on'}
            <Lines xValues={limX} yValues={limY} lineType={1} lineWidth={2} lineColor={populationColor} />
            {/if}
         </QQPlot>
      </div>

      <!-- Tables with values and quantiles -->
      <div class="app-qqtable-area">
         <DataTable
            variables={[
               {label: "i", values: si},
               {label: "x", values: sx},
               {label: "p", values: sp},
               {label: "z", values: sz}
            ]}
            decNum={[0, 1, 3, 2]}
            horizontal={true}
         />
      </div>

      <!-- control elements -->
      <div class="app-stattable-area">
         <DataTable
            variables={[
               {label: "", values: ["Mean", "St. dev.", "Skewness", "Kurtosis"]},
               {label: "Sample", values: [mean(sx), sd(sx), skewness(sx), kurtosis(sx)]},
               {label: "Population", values: [popMean, popStd, 0, 3.0]}
            ]}
            decNum={[-1, 1, 1]}
            horizontal={false}
         />
      </div>

      <div class="app-controls-area">
         <AppControlArea>
            <AppControlSwitch id="popLine" label="Population" bind:value={showPopLine} options={["on", "off"]} />
            <AppControlSwitch id="sampleSize" label="Sample size" bind:value={sampleSize} options={[4, 6, 9, 12]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={() => sx = getSample(sampleSize)} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>Quantile-quantile plot</h2>
      <p>
         This app shows how to use quantile-quantile (QQ) plot to check if your values came from normally distributed
         population. In this case the values (height of people, <em>x</em>) are indeed
         randomly taken from a population, where they follow normal distribution with mean = 170 cm and standard
         deviation = 10 cm. The values of the current sample are shown in
         the large table as row <em>x</em> and on the plot as y-axis values.
      </p>
      <p>
         First, for every value <em>x</em> we compute probability <em>p</em>, to get a value even smaller,
         similar to what we did when computed percentiles. In this case we use <code>p = (i - 0.5) / n</code>.
         But if sample size is smaller than 10, the formula is slightly
         different: <code>p = (i - 0.375) / (n + 0.25)</code>. For example, if sample size = 6, then the
         first value (i = 1) will have the following p: <code>p = (1 - 0.375) / (6 + 0.25) = 0.100</code>.
      </p>

      <p>
         After that, for every <em>p</em> we find corresponding standard score, <em>z</em>, using ICDF function for
         normal distribution. For example, if p = 0.100, the z-score can be found to be equal to -1.28. You can check
         it using app for PDF/CDF/ICDF or in R by running <code>qnorm(0.100)</code>. Finally we make a plot where sample
         values, <em>x</em> are shown as y-axis and the <em>z</em>-scores are shown
         as x-axis. In case if values follow normal distribution ideally they have linear dependence on z-scores, so the
         points will lie close to a straight line, shown as blue. The closer real points are to this line
         the more likely that they came from normally distributed population.
      </p>
   </div>
</StatApp>

<style>

.app-layout {
   width: 100%;
   height: 100%;
   position: relative;
   display: grid;
   grid-template-areas:
      "plot stattable"
      "plot controls"
      "plot ."
      "qqtable .";
   grid-template-rows: min-content min-content auto min-content;
   grid-template-columns: 65% 35%;
}

.app-qqplot-area {
   grid-area: plot;
   padding-right: 20px;
}

.app-qqtable-area {
   grid-area: qqtable;
   padding-top: 20px;
   width: 100%;
   text-align: center;
   display: flex;
   justify-content: center;
}

.app-stattable-area {
   grid-area: stattable;
   padding-right: 20px;
}

.app-controls-area {
   grid-area: controls;
   margin-top: 40px;
}

:global(.datatable) {
   width: 100%;
   color: #404040;
   text-align: right;
}

.app-qqtable-area :global(.datatable  td) {
   font-size: 0.9em;
   padding: 0.25em 0.5em;
}

.app-qqtable-area :global(.datatable > tr:first-of-type) {
   border-bottom: solid 1px #e0e0e0;
}

.app-qqtable-area :global(.datatable > tr:nth-of-type(2) > td) {
   font-weight: bold;
   color: #336688;
}

</style>