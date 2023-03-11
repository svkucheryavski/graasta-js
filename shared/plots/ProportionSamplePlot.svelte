<script>
   import { sum } from 'mdatools/stat';
   import { Vector, Index } from 'mdatools/arrays';
   import { Axes, TextLabels, Points } from 'svelte-plots-basic/2d';
   import { formatLabels } from '../../shared/graasta.js';

   export let groups;
   export let sample;
   export let colors;

   // number of circles to show in 1 row on the plot
   const nInRow = 10;

   // indices and groups of sample individuals
   $: sampIndex = Index.seq(1, sample.length);
   $: sampIndexVec = Vector.seq(1, sample.length);
   $: sampGroups = groups.subset(sample);
   $: labelText = formatLabels({
      name: "Sample proportion",
      value: (sum(sampGroups.apply(v => v == 1)) / sample.length).toFixed(3)
   });

   // indices of points for each group
   $: samp1Index = sampIndex.subset(sampGroups.which(v => v == 0));
   $: samp2Index = sampIndex.subset(sampGroups.which(v => v == 1));

   // coordinates of the sample circle
   $: sampX = sampIndexVec.apply(v => (v - 1) % nInRow + 1);
   $: sampY = sampIndexVec.apply(v => Math.floor((v - 1) / nInRow + 1));

   // X and Y coordinates for each group
   $: samp1X = sampX.subset(samp1Index);
   $: samp1Y = sampY.subset(samp1Index);
   $: samp2X = sampX.subset(samp2Index);
   $: samp2Y = sampY.subset(samp2Index);
</script>

<Axes limX={[0.25, nInRow + 0.5]} limY={[-1.25, 6.25]}>
   {#if samp1Index.length > 0}
   <Points xValues={samp1X} yValues={samp1Y} borderWidth={3} markerSize={2.15} borderColor={colors[0]} faceColor="white"/>
   {/if}
   {#if samp2Index.length > 0}
   <Points xValues={samp2X} yValues={samp2Y} borderWidth={3} markerSize={2.15} borderColor={colors[1]} faceColor="white"/>
   {/if}
   <TextLabels textSize={1.25} xValues={[nInRow/2]} yValues={[-0.5]} labels={labelText} />
</Axes>

