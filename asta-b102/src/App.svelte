<script>
   import { max, range, count, split, quantile, min } from 'mdatools/stat';
   import { c, Vector, Index } from 'mdatools/arrays';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';

   // local components
   import HistPlot from './AppHistPlot.svelte';
   import PercentilePlot from './AppPercentilePlot.svelte';

   let sampleSize = 6;
   let variableName = 'Height';

   const nBins = 30;
   const populationSize = 50000;

   // function for generation of values
   const getHeightValues = function(n) {
      const n1 = Math.round(n/2);
      const n2 = n - n1;
      return c(Vector.randn(n1, 160, 7), Vector.randn(n2, 178, 6)).sort();
   }

   const getIQValues = function(n) {
      return Vector.randn(n, 110, 5).sort();
   }

   const getAgeValues = function(n) {
      return Vector.rand(n, 18, 65).apply(v => Math.round(v * 10) / 10).sort();
   }

   const takeNewSample = () => {
      sample = getSample(population, sampleSize);
   }

   const createPopulation = function(title, generator, xLim) {

      const values = generator(populationSize);

      const bins = split(values, nBins);
      const counts = count(values, bins);
      const countsMode = max(counts);

      const Q1 = quantile(values, 0.25);
      const Q2 = quantile(values, 0.50);
      const Q3 = quantile(values, 0.75);
      const IQR = Q3 - Q1;
      const outLeft = Q1 - 1.5 * IQR;
      const outRight = Q3 + 1.5 * IQR;

      const rn = range(values.filter(v => v >= outLeft && v <= outRight))
      const outliers = values.filter(v => v < outLeft || v > outRight)

      const gmn = min(values);
      const gmx = max(values);
      const dx = (gmx - gmn) * 0.05;

      return {
         generator: generator,
         title: title,
         hist: {
            xLim: [gmn - dx, gmx + dx],
            yLim: [0, 1.3],
            counts: counts.divide(countsMode),
            bins: bins
         },
         bw: {
            positions: [1.2, 1.1],
            size: 0.05,
            quartiles: [Q1, Q2, Q3],
            range: rn,
            outliers: outliers
         },
         ps: {
            position: 0.075,
            xValues: values.subset(Index.seq(1, populationSize, 100)),
            yValues: Vector.seq(1/populationSize, 1, 100/populationSize)
         }
      };
   }

   const populations = {
      Height: createPopulation('Height, cm', getHeightValues),
      Age: createPopulation('Age, years', getAgeValues),
      IQ: createPopulation('IQ', getIQValues),
   };

   const getSample = function(population, size) {
      size = Math.round(size);
      return({
         x: population.generator(size),
         y: Vector.fill(population.ps.position, size),
         p: Vector.seq(1, size).apply(v => (v - 0.5) / size)
      });
   }

   $: population = populations[variableName];
   $: sample = getSample(population, sampleSize);
   $: errormsg = sampleSize < 3 || sampleSize > 30 ? "Sample size should be between 3 and 30." : "";
</script>

<StatApp>
   <div class="app-layout">

      <!-- plot with histogram -->
      <div class="app-histogram-area">
         <HistPlot {sample} {population} />
      </div>

      <!-- plot with population and sample percentiles -->
      <div class="app-percentile-area">
         <PercentilePlot {sample} {population} />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea {errormsg}>
            <AppControlSwitch id="variableName" label="Property" bind:value={variableName} options={Object.keys(populations)} />
            <AppControlRange id="sampleSize" label="Sample size" bind:value={sampleSize} min={3} max={30} step={1} decNum={0} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>Samples and populations</h2>
      <p>
         This app helps you to investigate how different a sample can be when it is being randomly taken from corresponding
         population.
      </p>
      <p>
         You can investigate this difference for one of the three parameters: Height, Age and IQ of a population of people.
         Each parameter has own distribution. Thus, <em>Age</em> is distributed uniformly, <em>IQ</em> is distributed normally
         and <em>Height</em> has distribution with two peaks (bimodal). You can also see how sample size influences the difference.
      </p>

      <p>
         Plot series made for a population (histogram and boxplot on the left part and percentile plot on the right) are shown
         using gray colors. The size of the population is <em>N</em> = 50&nbsp;000. The plot series for current sample are
         shown in blue. A new sample is taken when you change any of the controls — select the population parameter or the
         sample size as well as when you force to take a new sample by clicking the specific button.
      </p>

   </div>
</StatApp>

<style>

.app-layout {
   width: 100%;
   height: 100%;
   position: relative;

   display: grid;
   grid-template-columns: 3fr 2fr;
   grid-template-rows: 3fr 1fr;
   grid-template-areas:
      "plot1 plot2"
      "plot1 controls";
}

.app-histogram-area {
   grid-area: plot1;
   box-sizing: border-box;
   height: 100%;
   width: 100%;
}

.app-percentile-area {
   grid-area: plot2;
   box-sizing: border-box;
   height: 100%;
   width: 100%;
}

.app-controls-area {
   padding-top: 20px;
   padding-left: 20px;
   grid-area: controls;
}

</style>