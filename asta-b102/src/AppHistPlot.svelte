<script>
   import { Axes, XAxis, Points } from 'svelte-plots-basic/2d';
   import { BoxAndWhiskers, Histogram } from 'mdatools-plots/stat';
   import { colors } from "../../shared/graasta";

   export let sample;
   export let population;
</script>

<Axes limX={population.hist.xLim} limY={population.hist.yLim} xLabel={population.title} margins={[1, 1, 0.5, 0.5]}>

   <Histogram bins={population.hist.bins} counts={population.hist.counts}
      faceColor={colors.plots.POPULATIONS_PALE[0]} borderColor="transparent" />
   <BoxAndWhiskers quartiles={population.bw.quartiles} range={population.bw.range} outliers={population.bw.outliers}
      boxPosition={population.bw.positions[0]} boxSize={population.bw.size}
      borderColor={colors.plots.POPULATIONS[0]} horizontal={true} lineWidth={1.5} />

   <Points xValues={sample.x} yValues={sample.y} faceColor="transparent" markerSize={1.25}
      borderColor={colors.plots.SAMPLES[0]} borderWidth={2} />
   <BoxAndWhiskers values={sample.x} boxPosition={population.bw.positions[1]} boxSize={population.bw.size}
      borderColor={colors.plots.SAMPLES[0]} horizontal={true} lineWidth={1.5}/>

   <XAxis slot="xaxis" />
</Axes>
