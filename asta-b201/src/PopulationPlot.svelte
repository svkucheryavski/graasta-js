<script>
   import {seq, subset, expandGrid, mrange} from 'stat-js';
   import {Axes, ScatterSeries} from 'svelte-plots-basic';

   export let groups;
   export let sample;
   export let colors;

   // size of population and axes plus coordinates of the points
   const popSize = groups.length;
   const popAxisSize = Math.round(Math.sqrt(popSize));
   const popIndex = seq(1, popSize, popSize);
   const pop = expandGrid(seq(1, popAxisSize, popAxisSize), seq(1, popAxisSize, popAxisSize))

   if (popAxisSize ** 2 !== popSize) {
      throw new Error("Population size should be a square of a number.");
   }

   // indices for blue and red circles
   $: pop1Index = popIndex.filter((v, i) => groups[i] == 1);
   $: pop2Index = popIndex.filter((v, i) => groups[i] == 2);

   // X and Y coordinates for each group
   $: pop1X = subset(pop[0], pop1Index);
   $: pop1Y = subset(pop[1], pop1Index);
   $: pop2X = subset(pop[0], pop2Index);
   $: pop2Y = subset(pop[1], pop2Index);

   // indices of sample points for each group
   $: samp1Index = sample.filter(v => groups[v - 1] == 1);
   $: samp2Index = sample.filter(v => groups[v - 1] == 2);

   // X and Y coordinates of sample points from group 1
   $: samp1X = subset(pop[0], samp1Index);
   $: samp1Y = subset(pop[1], samp1Index);

   // X and Y coordinates of sample points from group 2
   $: samp2X = subset(pop[0], samp2Index);
   $: samp2Y = subset(pop[1], samp2Index);
</script>

<Axes title="Population (N = {popSize})" limX={mrange(pop[0], 0.1)} limY={mrange(pop[1], 0.05)} >
   <!-- population points  -->
   <ScatterSeries xValues={pop1X} yValues={pop1Y} borderWidth={1.5} markerSize={1.5} borderColor={colors[0] + "50"} faceColor={colors[0] + "50"}/>
   <ScatterSeries xValues={pop2X} yValues={pop2Y} borderWidth={1.5} markerSize={1.5} borderColor={colors[1] + "50"} faceColor={colors[1] + "50"}/>
   <!-- sample points on top  -->
   <ScatterSeries xValues={samp1X} yValues={samp1Y} borderWidth={2.75} markerSize={1.65} borderColor={colors[0]} faceColor={"white"}/>
   <ScatterSeries xValues={samp2X} yValues={samp2Y} borderWidth={2.75} markerSize={1.65} borderColor={colors[1]} faceColor={"white"}/>
</Axes>

