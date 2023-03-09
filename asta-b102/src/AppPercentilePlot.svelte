<script>
   import { Axes, XAxis, YAxis, Box, Lines, Points } from 'svelte-plots-basic/2d';
   import { colors } from '../../shared/graasta';

   export let sample;
   export let population;
</script>

<Axes limY={[-0.05, 1.05]} limX={population.hist.xLim} xLabel={population.title} yLabel="Percentiles" margins={[1, 1, 0.5, 0.5]}>

   <Lines xValues={population.ps.xValues} yValues={population.ps.yValues} lineColor={colors.plots.POPULATIONS[0]} />

   <Lines xValues={sample.x} yValues={sample.p} lineColor={colors.plots.SAMPLES[0]} lineWidth={1.5} />
   <Points xValues={sample.x} yValues={sample.p} faceColor="white" borderColor={colors.plots.SAMPLES[0]}
      marker={1} markerSize={1.1} borderWidth={2} />

   <XAxis slot="xaxis" showGrid={true} />
   <YAxis slot="yaxis" showGrid={true} />
   <Box slot="box" />
</Axes>

