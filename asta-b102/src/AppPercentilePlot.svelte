<script>
   import {Axes, XAxis, YAxis, Box, LineSeries, ScatterSeries} from 'svelte-plots-basic';

   export let sample;
   export let population;
   export let sampleColor;
   export let populationColor;
</script>

<Axes limY="{[-0.05, 1.05]}" limX="{population.hist.xLim}" xLabel="{population.title}" yLabel="Percentiles">
   <LineSeries xValues={population.ps.xValues} yValues={population.ps.yValues} lineColor="{populationColor}" />

   {#if sample.x.length >= 3 && sample.x.length <= 30}
   <LineSeries xValues={sample.x} yValues={sample.p} lineColor="{sampleColor}" />
   <ScatterSeries xValues={sample.x} yValues={sample.p} faceColor="white" borderColor="{sampleColor}" marker={1} borderWidth="{1.5}" />
   {/if}

   <XAxis slot="xaxis" showGrid="{true}" />
   <YAxis slot="yaxis" showGrid="{true}" />
   <Box slot="box" />
</Axes>

