<script>
   import {seq, sd, rep, mean, dnorm, rnorm, max} from 'stat-js';
   import {Axes, XAxis, YAxis, LineSeries,ScatterSeries, AreaSeries, Segments} from 'svelte-plots-basic';
   import {DataTable} from 'svelte-plots-stat';

   // children blocks

   // common blocks
   import {default as StatApp} from '../../shared/StatApp.svelte';
   import AppControlArea from '../../shared/AppControlArea.svelte';
   import AppControlButton from '../../shared/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/AppControlSwitch.svelte';
   import AppControlRange from '../../shared/AppControlRange.svelte';

   const globalMean = 100;
   let effectExpected = 0;
   let noiseExpected = 10;
   let sampleSize = 3;

   $: mu1 = globalMean - effectExpected / 2;
   $: x1 = seq(mu1 - 3.5 * noiseExpected, mu1 + 3.5 * noiseExpected, 100);
   $: f1 = dnorm(x1, mu1, noiseExpected);
   $: y1 = f1.map(v => v * 15);

   $: mu2 = globalMean + effectExpected / 2;
   $: x2 = seq(mu2 - 3.5 * noiseExpected, mu2 + 3.5 * noiseExpected, 100);
   $: f2 = dnorm(x2, mu2, noiseExpected);
   $: y2 = f2.map(v => 3 - v * 15);

   $: s1 = rnorm(sampleSize, mu1, noiseExpected);
   $: s2 = rnorm(sampleSize, mu2, noiseExpected);

   $: effectObserved = mean(s2) - mean(s1);
   $: noiseObserved = Math.sqrt((sd(s1)**2 + sd(s2)**2) / sampleSize);
   $: tScore = effectObserved / noiseObserved;

   function takeNewSample() {
      s1 = rnorm(sampleSize, mu1, noiseExpected);
      s2 = rnorm(sampleSize, mu2, noiseExpected);
   }
</script>

<StatApp>
   <div class="app-layout">

      <!-- plot for population individuals  -->
      <div class="app-population-plot-area">
         <Axes limX={[-0.5, 3.5]} limY={[20, 180]} xLabel="Temperature, ºC" yLabel="Yield, mg">
            <XAxis slot="xaxis" showGgrid={true} ticks={[0, 3]} tickLabels={["120", "160"]}></XAxis>
            <YAxis slot="yaxis" grid={true}></YAxis>

            <LineSeries xValues={y1} yValues={x1} lineColor="#a0a0a0"></LineSeries>
            <AreaSeries xValues={y1} yValues={x1} fillColor="#f0f0f0" lineColor="transparent"/>
            <ScatterSeries xValues={rep(-0, sampleSize)} marker={1} yValues={s1} borderColor="#ff111180" borderWidth={2} markerSize={1.3} faceColor="white" />
            <ScatterSeries xValues={[0]} marker={1} yValues={[mean(s1)]} borderColor="#ff1111" markerSize={0.8} faceColor="#ff1111" />

            <LineSeries xValues={y2} yValues={x2} lineColor="#a0a0a0"></LineSeries>
            <AreaSeries xValues={y2} yValues={x2} fillColor="#f0f0f0" lineColor="transparent"/>
            <ScatterSeries xValues={rep(3, sampleSize)} yValues={s2} borderColor="#ff111180" borderWidth={2} markerSize={1.3} faceColor="white" />
            <ScatterSeries xValues={[3]} yValues={[mean(s2)]} borderColor="#ff1111" markerSize={0.8} faceColor="#ff1111" />

            <Segments xStart={[0]} xEnd={[3]} yStart={[mu1]} yEnd={[mu1]} lineType={2} lineColor="#a0a0a0" />
            <Segments xStart={[0]} xEnd={[3]} yStart={[mu2]} yEnd={[mu2]} lineType={2} lineColor="#a0a0a0" />
            <Segments xStart={[0]} xEnd={[3]} yStart={[mean(s1)]} yEnd={[mean(s2)]} lineColor="#ff0000" />
         </Axes>
      </div>

      <!-- control elements -->
      <div class="app-stattable-area">
         <DataTable
            variables={[
               {label: "Observed effect", values: [effectObserved]},
               {label: "Observed noise", values: [noiseObserved]},
               {label: "Observed t-score", values: [tScore]},
               {label: "95% CI for effect", values: [1]},
               {label: "# of samples taken", values: [1]},
               {label: "# of samples inside CI", values: [1]},
            ]}
            decNum={[2, 2, 2]}
            horizontal={true}
         />
      </div>

      <!-- control elements -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlRange id="effect" label="Expected effect" bind:value={effectExpected} min={-10} max={10} step={1} decNum={0} />
            <AppControlRange id="effect" label="Noise (σ)" bind:value={noiseExpected} min={5} max={20} step={1} decNum={0} />
            <AppControlButton id="newSample" label="Sample" text="Take new" on:click={takeNewSample} />
         </AppControlArea>
      </div>

   </div>

   <div slot="help">
      <h2>Population based confidence interval for proportion</h2>
      <p>
         This app allows you to play with proportion of a random sample. Here we have a population with N = 400
         individuals. Some of them are red, some are blue. You can change the proportion of the red
         individuals as you want (by default it is 50%). The population is shown as large plot on the left.
      </p>
      <p>
         If we know proportion of population and sample size we can compute an interval of expected proportions
         of the future samples. So, when you take a new random sample of that size from the population, its proportion
         will likely to be inside the interval. This interval is called <em>confidence interval for proportion</em>
         and since we compute it based on proportion parameter, it is <em>population based</em>.
      </p>
      <p>
         The interval for selected population proportion and current sample size computed for 95% confidence level is
         shown as a red area under a distribution curve on the right. The vertical line on that plot is a proportion of
         your current sample. Try to take many samples and see how often the proportion of the sample will be inside
         the interval (table under the plot shows this information). If you repeat this many (hundreds) times, about
         95% of the samples should have proportion within the interval. <strong>However this works only if number of
         individuals in each group is at least 5.</strong> So if proportion is 10% you need to have sample size n = 50 to meat
         this requirement.
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
      "pop sampplot"
      "pop ciplot"
      "pop controls";
   grid-template-rows: 150px 1fr 1fr;
   grid-template-columns: 65% 35%;
}


.app-population-plot-area {
   grid-area: pop;
   box-sizing: border-box;
   height: 100%;
   width: 100%;
   padding-right: 20px;
}


.app-sample-plot-area {
   grid-area: sampplot;
   background: black;
}

.app-sample-plot-area :global(.plot) {
   min-height: 150px;
}

.app-sample-plot-area {
   height: 150px;
}

.app-ci-plot-area {
   grid-area: ciplot;
}

.app-controls-area {
   grid-area: controls;
}

.app-stattable-area {
   padding: 1em;
}

.app-stattable-area :global(.datatable) {
   font-size: 0.95em;
   color: #606060;
}

.app-stattable-area :global(.datatable__label) {
   font-weight: normal;
}

.app-stattable-area :global(.datatable__value) {
   padding-left: 1em;
   font-weight: bold;
   color: #505050;
}

</style>