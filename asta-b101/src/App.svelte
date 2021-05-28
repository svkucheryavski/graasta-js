<script>
   import {max, count, rnorm, runif, split, quantile, min, getOutliers} from 'stat-js';
   import {Axes, XAxis, YAxis, Box, LineSeries, ScatterSeries} from 'svelte-plots-basic';
   import {BoxAndWhiskers, Histogram} from 'svelte-plots-stat';
   import {default as StatApp} from '../../shared/StatApp.svelte';

   let sampleSize = 6;
   let variableName = "Height";

   const nBins = 30;
   const populationSize = 50000;
   const sampleColor = "blue";
   const populationColor = "#a0a0a0";

   // function for generation of values
   const getHeightValues = function(n) {
      const n1 = Math.round(n/2);
      const n2 = n - n1;
      return rnorm(n1, 160, 7).concat(rnorm(n2, 178, 6)).sort((a, b) => a - b);
   }

   const getIQValues = function(n) {
      return rnorm(n, 110, 5).sort((a, b) => a - b);
   }

   const getAgeValues = function(n) {
      return runif(n, 18, 65).map( v => Math.round(v * 10) / 10).sort((a, b) => a - b);
   }

   const createPopulation = function(title, generator, xLim) {

      const values = generator(populationSize);

      const bins = split(values, nBins);
      const counts = count(values, bins);
      const countsMode = max(counts);

      const Q1 = quantile(values, 0.25);
      const Q2 = quantile(values, 0.50);
      const Q3 = quantile(values, 0.75);
      const outliers = getOutliers(values, Q1, Q3);

      const mn = min(outliers.length > 0 ? values.filter(v => !outliers.some(o => o == v)) : values);
      const mx = max(outliers.length > 0 ? values.filter(v => !outliers.some(o => o == v)) : values);

      const gmn = min(values);
      const gmx = max(values);
      const dx = (gmx - gmn) * 0.05;

      return {
         generator: generator,
         title: title,
         hist: {
            xLim: [gmn - dx, gmx + dx],
            yLim: [0, 1.3],
            counts: counts.map(v => v / countsMode),
            bins: bins
         },
         bw: {
            positions: [1.2, 1.1],
            size: 0.05,
            quartiles: [Q1, Q2, Q3],
            range: [mn, mx],
            outliers: outliers
         },
         ps: {
            position: 0.075,
            xValues: values.filter((v, i) => i % 10 == 0),
            yValues: Array.from({length: populationSize}, (v, i) => i / populationSize).filter((v, i) => i % 10 == 0)
         }
      };
   }

   const populations = {
      Height: createPopulation("Height, cm", getHeightValues),
      Age: createPopulation("Age, years", getAgeValues),
      IQ: createPopulation("IQ", getIQValues),
   };

   const getSample = function(population, size) {
      return({x: population.generator(size), y: Array.from({length: size}, () => population.ps.position), p: Array.from({length: size}, (v, i) => (i + 0.5) / sampleSize)});
   }

   $: pop = populations[variableName];
   $: sample = getSample(pop, sampleSize);
   $: errormsg = sampleSize < 3 || sampleSize > 30 ? "Sample size should be between 3 and 30." : "";

</script>

<StatApp>
   <div class="app-layout">

      <!-- plot with histogram -->
      <div class="app-histogram-area">
         <Axes limX="{pop.hist.xLim}" limY="{pop.hist.yLim}" xLabel="{pop.title}">
            <Histogram bins={pop.hist.bins} counts="{pop.hist.counts}" faceColor="#f0f0f0" borderColor="#e0e0e0" />
            <BoxAndWhiskers quartiles={pop.bw.quartiles} range={pop.bw.range} outliers={pop.bw.outliers} boxPosition="{pop.bw.positions[0]}" boxSize={pop.bw.size} borderColor="{populationColor}" horizontal="{true}" />

            {#if sample.x.length >= 3 && sample.x.length <= 30}
            <ScatterSeries xValues={sample.x} yValues={sample.y} faceColor="white" borderColor="{sampleColor}" borderWidth="{1.5}" />
            <BoxAndWhiskers values={sample.x} boxPosition="{pop.bw.positions[1]}" boxSize={pop.bw.size} borderColor="{sampleColor}" horizontal="{true}" />
            {/if}
            <XAxis slot="xaxis" />
         </Axes>
      </div>

      <!-- plot with population and sample percentiles -->
      <div class="app-percentile-area">
         <Axes limY="{[-0.05, 1.05]}" limX="{pop.hist.xLim}" xLabel="{pop.title}" yLabel="Percentiles">
            <LineSeries xValues={pop.ps.xValues} yValues={pop.ps.yValues} lineColor="{populationColor}" />

            {#if sample.x.length >= 3 && sample.x.length <= 30}
            <LineSeries xValues={sample.x} yValues={sample.p} lineColor="{sampleColor}" />
            <ScatterSeries xValues={sample.x} yValues={sample.p} faceColor="white" borderColor="{sampleColor}" marker={1} borderWidth="{1.5}" />
            {/if}

            <XAxis slot="xaxis" showGrid="{true}" />
            <YAxis slot="yaxis" showGrid="{true}" />
            <Box slot="box" />
         </Axes>
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <fieldset>
         <div class="app-control">
            <label for="variableName">Select property:</label>
            <select name="variableName" bind:value="{variableName}">
               {#each Object.keys(populations) as property}
               <option value="{property}">{property}</option>
               {/each}
            </select>
         </div>
         <div class="app-control">
            <label class="app-control__label" for="sampleSize">Sample size:</label>
            <input name="sampleSize" type="number" min="3" max="30" bind:value="{sampleSize}">
            <button on:click="{() => sample = getSample(pop, sampleSize)}">Take new</button>
         </div>
         <div class="app-control-error">
            {errormsg}
         </div>
         </fieldset>
      </div>

   </div>

   <div slot="help">
      <h2>Samples and populations</h2>
      <p>This app helps you to investigate how different a sample can be when it is being randomly taken from corresponding population.</p>
      <p>You can investigate this difference for several parameters, each has own distribution. Thus, <em>Age</em> is distributed
         uniformly, <em>IQ</em> is distributed normally and <em>Height</em> has distribution with two peaks (modes). You can also see how
         sample size influences the difference.
      </p>
      <p>Plot series made for a population (histogram and boxplot on the left part and percentile plot on the right) are shown using gray colors. The size of the population is <em>N</em> = 50&nbsp;000. The plot series for current sample are shown in blue. A new sample is taken when you change any of the controls — select the population parameter or the sample size as well as when you force to take a new sample by clicking the specific button.
      </p>

   </div>
</StatApp>

<style>

.app-layout {
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
   grid-area: controls;
}

</style>