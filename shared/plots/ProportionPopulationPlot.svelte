<script>
   import { Vector, Index } from 'mdatools/arrays';
   import { mrange } from 'mdatools/stat';
   import { expandgrid } from 'mdatools/misc';
   import { Axes, Points } from 'svelte-plots-basic/2d';

   export let groups;
   export let sample;
   export let populationColors;
   export let sampleColors;

   // size of population and axes plus coordinates of the points
   const popSize = groups.length;
   const popAxisSize = Math.round(Math.sqrt(popSize));
   const pop = expandgrid(Vector.seq(1, popAxisSize), Vector.seq(1, popAxisSize))

   if (popAxisSize ** 2 !== popSize) {
      throw new Error('ProportionPopulationPlot: population size should be a square of a number.');
   }

   // indices for blue and red circles
   $: pop1Index = groups.which(v => v == 0);
   $: pop2Index = groups.which(v => v == 1);

   // X and Y coordinates for each group
   $: pop1X = pop[0].subset(pop1Index);
   $: pop1Y = pop[1].subset(pop1Index);
   $: pop2X = pop[0].subset(pop2Index);
   $: pop2Y = pop[1].subset(pop2Index);

   // indices of sample points for each group

   // indices and groups of sample individuals
   $: sampIndex = Index.seq(1, sample.length);
   $: sampGroups = groups.subset(sample);

   // indices of points for each group
   $: samp1Index = sample.subset(sampGroups.which(v => v == 0));
   $: samp2Index = sample.subset(sampGroups.which(v => v == 1));

   // X and Y coordinates of sample points from group 1
   $: samp1X = samp1Index.length > 0 ? pop[0].subset(samp1Index) : [];
   $: samp1Y = samp1Index.length > 0 ? pop[1].subset(samp1Index) : [];

   // X and Y coordinates of sample points from group 2
   $: samp2X = samp2Index.length > 0 ? pop[0].subset(samp2Index) : [];
   $: samp2Y = samp2Index.length > 0 ? pop[1].subset(samp2Index) : [];
</script>

<Axes title="Population (N = {popSize})" limX={mrange(pop[0], 0.05)} limY={mrange(pop[1], 0.025)} >

   <!-- population points  -->
   {#if pop1X.length > 0 && pop1Y.length > 0}
   <Points xValues={pop1X} yValues={pop1Y} borderWidth={1.5} markerSize={1.5}
      borderColor={populationColors[0]} faceColor={populationColors[0] }/>
   {/if}
   {#if pop2X.length > 0 && pop2Y.length > 0}
   <Points xValues={pop2X} yValues={pop2Y} borderWidth={1.5} markerSize={1.5}
      borderColor={populationColors[1]} faceColor={populationColors[1] }/>
   {/if}

   <!-- sample points on top  -->
   {#if samp1X.length > 0 && samp1Y.length > 0}
   <Points xValues={samp1X} yValues={samp1Y} borderWidth={2.75} markerSize={1.65}
      borderColor={sampleColors[0]} faceColor="white" />
   {/if}
   {#if samp2X.length > 0 && samp2Y.length > 0}
   <Points xValues={samp2X} yValues={samp2Y} borderWidth={2.75} markerSize={1.65}
      borderColor={sampleColors[1]} faceColor="white" />
   {/if}
</Axes>

