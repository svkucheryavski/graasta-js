<script>
   import {rnorm, subset, cov, seq, mean, shuffle, max, min} from 'mdatools/stat';
   import {TextLegend} from 'svelte-plots-basic';

   // shared components
   import {default as StatApp} from "../../shared/StatApp.svelte";

   // shared components - controls
   import AppControlArea from "../../shared/controls/AppControlArea.svelte";
   import AppControlButton from "../../shared/controls/AppControlButton.svelte";
   import AppControlRange from "../../shared/controls/AppControlRange.svelte";
   import CovariancePlot from "../../shared/plots/CovariancePlot.svelte";

   // local components
   import AppTable from "./AppTable.svelte";

   // constant parameters
   const sampSize = 10;
   const popSize = 500;
   const meanX = 100;
   const sdX = 10;

   // constant
   const popZ = rnorm(popSize);
   const popX = rnorm(popSize, meanX, sdX);

   // variable parameters
   let popNoise = 10;
   let popSlope = 1;
   let sample = [];
   let selectedPoint;

   $: top = max(popY) - 4
   $: left = min(popX)

   function takeNewSample(popSize, sampSize) {
      sample = subset(shuffle(seq(1, popSize)), seq(1, sampSize));
      selectedPoint = -1;
   }

   function covText(x, y, name) {
      return "<tspan style='fill:#a0a0a0'>" + name + ":</tspan> cov(x, y) = <tspan style='font-weight:bold'>" + cov(x, y).toFixed(1) + "</tspan>";
   }

   $: popY = popX.map((x, i) => (x - meanX) * popSlope + meanX + popNoise * popZ[i]);
   $: takeNewSample(popSize, sampSize);

   $: sampX = subset(popX, sample);
   $: sampY = subset(popY, sample);
   $: sampMeanX = mean(sampX);
   $: sampMeanY = mean(sampY);

   $: indPos = sampX.map((x, i) => ((sampX[i] - sampMeanX) * (sampY[i] - sampMeanY)) > 0 ? i + 1: undefined).filter(x => x);
   $: indNeg = sampX.map((x, i) => ((sampX[i] - sampMeanX) * (sampY[i] - sampMeanY)) < 0 ? i + 1: undefined).filter(x => x);
   $: indNeu = sampX.map((x, i) => ((sampX[i] - sampMeanX) * (sampY[i] - sampMeanY)) === 0 ? i + 1: undefined).filter(x => x);
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-plot-area">
         <!-- scatter plot -->
         <CovariancePlot bind:selectedPoint={selectedPoint} {popX} {sampX} {popY} {sampY} {indNeg} {indPos} {indNeu}>

            <!-- labels for covariance -->
            <TextLegend left={left} top={top} dy="1.5em" elements={[covText(popX, popY, "population"), covText(sampX, sampY, "sample")]} pos={2} textSize={0.9} faceColor="#606060"/>

         </CovariancePlot>
      </div>
      <div class="app-table-area">
         <AppTable {selectedPoint} {sampX} {sampY} {indNeg} {indPos} {indNeu} {sampMeanX} {sampMeanY} />
      </div>
      <div class="app-controls-area">
         <!-- Control elements -->
         <AppControlArea>
            <AppControlRange
               id="slope" label="Slope"
               bind:value={popSlope} min={-1.5} max={1.5} step={0.1} decNum={1}
            />
            <AppControlRange
               id="noise" label="Noise"
               bind:value={popNoise} min={0} max={30} step={1} decNum={0}
            />
            <AppControlButton
               on:click={() => takeNewSample(popSize, sampSize)}
               id="newSample" label="Sample" text="Take new"></AppControlButton>
         </AppControlArea>
      </div>
   </div>

   <div slot="help">
      <h2>Covariance</h2>
      <p>
         This app helps to understand covariance — a statistic which tells if two variables, <em>x</em> and <em>y</em> have a linear relationship (co-vary). If covariance is positive, then increasing <em>x</em> will likely lead to increasing of <em>y</em> value and vice versa. To compute the covariance, we first calculate distance from x- and y-value of a data point to corresponding means and then take a product of the two distances. The covariance is a sum of the distance products divided to the number of degrees of freedom (n - 1). You can see all these calculations in a table.
      </p>
      <p>
         Try to change parameters of a population: amount of noise and a slope of best fit line which has mean values as the origin. You will see how this influences your sample, and the sample co-variance. If product of two distances is positive this point contributes positively to the covariance and such point and the corresponding row in the table is shown using red color. If product of the two distances is negative — blue color is used. You can also select any sample point and see the two distances and their products.
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
      "plot table"
      "plot controls";

   grid-template-rows: 1fr auto;
   grid-template-columns: 65% 35%;
}

.app-plot-area {
   grid-area: plot;
}

.app-table-area {
   grid-area: table;
}

.app-controls-area {
   padding-left: 1em;
   grid-area: controls;
}

</style>