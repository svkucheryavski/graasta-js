<script>
   import {rnorm, gamma, subset, cov, seq, shuffle, dt} from 'mdatools/stat';
   import {lmfit} from 'mdatools/models';

   // shared components
   import {default as StatApp} from "../../shared/StatApp.svelte";

   // shared components - controls
   import AppControlArea from "../../shared/controls/AppControlArea.svelte";
   import AppControlButton from "../../shared/controls/AppControlButton.svelte";
   import AppControlRange from "../../shared/controls/AppControlRange.svelte";
   import AppPlot from "./AppPlot.svelte";

   // local components
   import AppTable from "./AppTable.svelte";
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // constant parameters
   const sampSize = 10;
   const popSize = 500;
   const meanX = 1.65;
   const sdX = 0.1;

   // constant
   const popZ = rnorm(popSize);
   const popX = rnorm(popSize, meanX, sdX);

   // variable parameters
   let popNoise = 2;
   let sample = [];
   let selectedPoint;
   let errorType = "full";

   function takeNewSample(popSize, sampSize) {
      sample = subset(shuffle(seq(1, popSize)), seq(1, sampSize));
      selectedPoint = -1;
   }

   function covText(x, y, name) {
      return "<tspan style='fill:#a0a0a0'>" + name + ":</tspan> cov(x, y) = <tspan style='font-weight:bold'>" + cov(x, y).toFixed(1) + "</tspan>";
   }

   // population coordinates and model
   $: popY = popX.map((x, i) => -40 + 65 * x + popNoise * popZ[i]);
   $: popModel = lmfit(popX, popY);

   // sample coordinates and model
   $: sampX = subset(popX, sample);
   $: sampY = subset(popY, sample);
   $: sampModel = lmfit(sampX, sampY);

   $: takeNewSample(popSize, sampSize);
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-plot-area">
         <!-- scatter plot -->
         <AppPlot bind:selectedPoint={selectedPoint} {errorType} {popModel} {sampModel} />
      </div>
      <div class="app-table-area">
         <AppTable {selectedPoint} {sampModel} />
      </div>
      <div class="app-controls-area">
         <!-- Control elements -->
         <AppControlArea>
            <AppControlSwitch
               id="errorType" label="Error"
               bind:value={errorType} options={["full", "fitting", "sampling"]}
            />
            <AppControlRange
               id="noise" label="Noise"
               bind:value={popNoise} min={0} max={5} step={0.1} decNum={0}
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
         Try to change parameters of a population: amount of noise and a slope of best fit line which has mean values as the origin. You will see how this influences your sample, and the sample co-variance. If product of two distances is positive this point contributes positively to the covariance and such point and the corresponding row in the table is shown using red color. If product of the two distances is negative — blue color is used.
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