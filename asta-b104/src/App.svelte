<script>
   import {max, ppoints, sd, seq, pnorm, rnorm, skewness, split, quantile, min, getOutliers, mean} from 'stat-js';
   import {DataTable} from 'svelte-plots-stat';
   import {Axes, XAxis, YAxis, Box, LineSeries, ScatterSeries} from 'svelte-plots-basic';

   // common blocks
   import {default as StatApp} from '../../shared/StatApp.svelte';
   import AppControlArea from '../../shared/AppControlArea.svelte';
   import AppControlButton from '../../shared/AppControlButton.svelte';
   import AppControlSelect from '../../shared/AppControlSelect.svelte';

   // app blocks
   // import HistPlot from "./AppHistPlot.svelte";
   // import PercentilePlot from "./AppPercentilePlot.svelte";

   let sampleSize = 6;
   let variableName = "Height";

   const sampleColor = "blue";
   const populationColor = "#a0a0a0";

   const popMean = 170;
   const popStd = 10;
   const limX = [-3, 3];
   const limY = [popMean - 3 * popStd, popMean + 3 * popStd];

   const zseq = seq(-5, 5, 100000);
   const pseq = pnorm(zseq);

   const closestIndex = (x, a) => {
      const c =  x.reduce((prev, curr) => Math.abs(curr - a) < Math.abs(prev - a) ? curr : prev);
      return x.indexOf(c);
   }

   const getSample = function(n) {
      return(rnorm(n, popMean, popStd).sort((a, b) => a - b));
   }

   $: si = Array.from({length: sampleSize}, (v, i) => i + 1);
   $: sp = ppoints(sampleSize);
   $: sz = sp.map((v, i) => zseq[closestIndex(pseq, v)]);
   $: sx = getSample(sampleSize);
   $: errormsg = sampleSize < 3 || sampleSize > 30 ? "Sample size should be between 3 and 30." : "";
</script>

<StatApp>
   <div class="app-layout">

      <!-- QQ plot with corresponding data  -->
      <div class="app-qqplot-area">
         <Axes {limX} {limY} yLabel="Height, cm" xLabel="Standard score, z">
            <XAxis slot="xaxis" showGrid={true}></XAxis>
            <YAxis slot="yaxis" showGrid={true}></YAxis>
            <Box slot="box"></Box>
            <LineSeries xValues={limX} yValues={limY} lineType={2} lineColor={populationColor} />
            <ScatterSeries xValues={sz} yValues={sx} borderWidth={2} />
         </Axes>

         <div class="qqtable-area">
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
      </div>

      <!-- control elements -->
      <div class="app-stat-and-controls-area">
         <DataTable
            variables={[
               {label: "", values: ["Mean", "St. dev.", "Skewness"]},
               {label: "Sample", values: [mean(sx), sd(sx), skewness(sx)]},
               {label: "Population", values: [popMean, popStd, 0]}
            ]}
            decNum={[0, 1, 1]}
            horizontal={false}
         />

         <div class="controls-area">
         <AppControlArea {errormsg}>
            <AppControlSelect id="sampleSize" label="Sample size" bind:value={sampleSize} options={[4, 6, 10, 13]} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={() => sx = getSample(sampleSize)} />
         </AppControlArea>
         </div>
      </div>

   </div>

   <div slot="help">
      <h2>Quantile-quantile plot</h2>
      <p>
         This app shows how to use quantile-quantile (QQ) plot to check if your values came from normally distributed
         population. In this case the values (height of people, <em>x</em>) are indeed
         randomly taken from a population, where they follow normal distribution with mean = 170 cm and standard
         deviation = 10 cm. The gray dashed line on the plot corresponds to the population (in conventional QQ-plot
         it is not shown as we know nothing about the population). The values of the current sample are shown in
         the large table as row <em>x</em> and on the plot as y-axis values.
      </p>
      <p>
         First, for every value <em>x</em> we compute probability <em>p</em>, to get a value even smaller,
         similar to what we did when computed percentiles. In this case we use <code>p = (i - 0.5) / n</code>.
         But if sample size is smaller than 10, the formulla is slightly
         adjusted: <code>p = (i - 0.375) / (n + 0.25)</code>. For example, if sample size = 6, then the
         first value (i = 1) will have the following p: <code>p = (1 - 0.375) / (6 + 0.25) = 0.100</code>.
      </p>

      <p>
         After that for every <em>p</em> we find corresponding standard score, <em>z</em>, using ICDF function for
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
   display: flex;
}

.app-qqplot-area {
   box-sizing: border-box;
   height: 100%;
   width: 100%;
   display: flex;
   flex-direction: column;
   padding-right: 20px;
}

.qqtable-area {
   padding-top: 20px;
   width: 100%;
   text-align: center;
   display: flex;
   justify-content: center;
}

.app-stat-and-controls-area {
   flex: 1 1 40%;
   display: flex;
   flex-direction: column;
}

.controls-area {
   margin-top: 40px;
}

:global(.datatable) {
   width: auto;
   color: #404040;
   text-align: right;
}

.qqtable-area :global(.datatable  td) {
   font-size: 0.9em;
   padding: 0.25em 0.5em;
}

.qqtable-area :global(.datatable > tr:first-of-type) {
   border-bottom: solid 1px #e0e0e0;
}

.qqtable-area :global(.datatable > tr:nth-of-type(2) > td) {
   font-weight: bold;
   color: blue;
}

</style>