<script>
   import { Vector } from 'mdatools/arrays';
   import { Axes, YAxis, Segments, Points } from 'svelte-plots-basic/2d';
   import { BoxAndWhiskers } from 'mdatools-plots/stat';

   export let popMeans;
   export let popSigma;
   export let samples;
   export let color = '#202020';
   export let boxColor = '#d0d0d0';
   export let limY = [-75, 75];
   export let limX = [-0.5, 2.5];

   $: popQuartiles = popMeans.map(v => [v - popSigma, v, v + popSigma]);
   $: popRanges = popQuartiles.map(v => [v[0] - 1.5 * (v[2] - v[0]), v[2] + 1.5 * (v[2] - v[0])]);
</script>

<Axes {limX} {limY} margins={[0.5, 1, 0.5, 0.2]}>
   {#each popQuartiles as p, i}
      <BoxAndWhiskers
         lineWidth={2}
         faceColor={boxColor}
         borderColor={boxColor}
         range={popRanges[i]}
         quartiles={popQuartiles[i]}
         outliers={[]}
         boxPosition={i}
         boxSize={0.5}
         horizontal={false}
      />
      <Segments lineType={2} xStart={[-0.5]} xEnd={[2.5]} yStart={[0]} yEnd={[0]} lineColor="#909090" />
      <Points borderWidth={2}  faceColor="transparent" borderColor={color} markerSize={1.25}
         xValues={Vector.fill(i, samples[i].length)} yValues={samples[i]} />
   {/each}
   <YAxis slot="yaxis" />
</Axes>

