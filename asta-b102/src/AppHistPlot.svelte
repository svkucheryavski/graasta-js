<script>
   import {Axes, XAxis, ScatterSeries} from 'svelte-plots-basic';
   import {BoxAndWhiskers, Histogram} from 'svelte-plots-stat';

   export let sample;
   export let population;
   export let sampleColor = "blue";
   export let populationColor = "#a0a0a0";

</script>

<Axes limX="{population.hist.xLim}" limY="{population.hist.yLim}" xLabel="{population.title}">
   <Histogram bins={population.hist.bins} counts="{population.hist.counts}" faceColor="#f0f0f0" borderColor="#e0e0e0" />
   <BoxAndWhiskers quartiles={population.bw.quartiles} range={population.bw.range} outliers={population.bw.outliers} boxPosition="{population.bw.positions[0]}" boxSize={population.bw.size} borderColor="{populationColor}" horizontal="{true}" />

   {#if sample.x.length >= 3 && sample.x.length <= 30}
   <ScatterSeries xValues={sample.x} yValues={sample.y} faceColor="white" borderColor="{sampleColor}" borderWidth="{1.5}" />
   <BoxAndWhiskers values={sample.x} boxPosition="{population.bw.positions[1]}" boxSize={population.bw.size} borderColor="{sampleColor}" horizontal="{true}" />
   {/if}
   <XAxis slot="xaxis" />
</Axes>
