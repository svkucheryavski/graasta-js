<script>
   import {rep} from 'stat-js';
   import {Axes, XAxis, YAxis, Segments, TextLabels, ScatterSeries} from 'svelte-plots-basic';
   import {BoxAndWhiskers} from 'svelte-plots-stat';

   export let popMeans;
   export let popSigma;
   export let samples;
   export let color;
   export let boxColor;

   $: popQuartiles = popMeans.map(v => [v - popSigma, v, v + popSigma]);
   $: popRanges = popQuartiles.map(v => [v[0] - 1.5 * (v[2] - v[0]), v[2] + 1.5 * (v[2] - v[0])]);
</script>

<Axes limX={[-0.5, 2.5]} limY={[-75, 75]}>
   {#each popQuartiles as p, i}
      <BoxAndWhiskers
         lineWidth={2}
         faceColor={boxColor}
         borderColor={boxColor}
         range={popRanges[i]}
         quartiles={popQuartiles[i]}
         boxPosition={i}
         boxSize={0.5}
         horizontal={false}
      />
      <Segments lineType={2} xStart={[-0.5]} xEnd={[2.5]} yStart={[0]} yEnd={[0]} lineColor="#909090" />
      <ScatterSeries borderWidth={2}  faceColor="transparent" borderColor={color} markerSize={1.25} xValues={rep(i, samples[i].length)} yValues={samples[i]} />
   {/each}
   <YAxis slot="yaxis" />
</Axes>

