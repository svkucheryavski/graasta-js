<script>
   import {seq, subset} from 'stat-js';
   import {Axes, ScatterSeries} from 'svelte-plots-basic';

   export let groups;
   export let sample;
   export let colors;

   // number of circles to show in 1 row on the plot
   const nInRow = 10;

   // indices and groups of sample individuals
   $: sampIndex = seq(1, sample.length, sample.length);
   $: sampGroups = subset(groups, sample);

   // indices of points for each group
   $: samp1Index = sampIndex.filter(v => sampGroups[v - 1] == 1);
   $: samp2Index = sampIndex.filter(v => sampGroups[v - 1] == 2);

   // coordinates of the sample circle
   $: sampX = sampIndex.map(v => (v - 1) % nInRow + 1);
   $: sampY = sampIndex.map(v => Math.floor((v - 1) / nInRow + 1));

   // X and Y coordinates for each group
   $: samp1X = subset(sampX, samp1Index);
   $: samp1Y = subset(sampY, samp1Index);
   $: samp2X = subset(sampX, samp2Index);
   $: samp2Y = subset(sampY, samp2Index);
</script>

<Axes limX={[0.25, nInRow + 0.5]} limY={[-1.25, 6.25]}>
   <ScatterSeries xValues={samp1X} yValues={samp1Y} borderWidth={3} markerSize={2.15} borderColor={colors[0]} faceColor={"white"}/>
   <ScatterSeries xValues={samp2X} yValues={samp2Y} borderWidth={3} markerSize={2.15} borderColor={colors[1]} faceColor={"white"}/>
</Axes>

