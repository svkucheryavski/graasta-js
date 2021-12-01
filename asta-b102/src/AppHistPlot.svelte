<script>
   import {Axes, XAxis, ScatterSeries} from 'svelte-plots-basic';
   import {colors} from "../../shared/graasta";

   import BoxAndWhiskers from "../../shared/plots/BoxAndWhiskers.svelte";
   import Histogram from "../../shared/plots/Histogram.svelte";

   export let sample;
   export let population;

</script>

<Axes limX="{population.hist.xLim}" limY="{population.hist.yLim}" xLabel="{population.title}">
   <Histogram bins={population.hist.bins} counts="{population.hist.counts}"
      faceColor={colors.plots.POPULATIONS_PALE[0]} borderColor={"transparent"} />

   <BoxAndWhiskers quartiles={population.bw.quartiles} range={population.bw.range} outliers={population.bw.outliers}
      boxPosition="{population.bw.positions[0]}" boxSize={population.bw.size}
      borderColor="{colors.plots.POPULATIONS[0]}" horizontal="{true}" lineWidth={1.5} />

   <ScatterSeries xValues={sample.x} yValues={sample.y} faceColor="transparent" markerSize={1.25}
      borderColor={colors.plots.SAMPLES[0]} borderWidth={2} />
   <BoxAndWhiskers values={sample.x} boxPosition={population.bw.positions[1]} boxSize={population.bw.size}
      borderColor={colors.plots.SAMPLES[0]} horizontal="{true}" lineWidth={1.5}/>

   <XAxis slot="xaxis" />
</Axes>
