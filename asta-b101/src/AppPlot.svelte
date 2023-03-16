<script>
   import { max, mean, min } from 'mdatools/stat';
   import { vector, Vector } from 'mdatools/arrays';
   import { Axes, XAxis, Segments, TextLabels, Points} from 'svelte-plots-basic/2d';
   import { BoxAndWhiskers } from 'mdatools-plots/stat';

   // shared components
   import {colors} from '../../shared/graasta';

   export let sample;
   export let stats;

   // fixed values
   const statLabels = ['min', 'Q1', 'Q2', 'Q3', 'max'];
   const limY = [-2, 4.0];
   const statNum = statLabels.length;
   const statLineColor = '#d8d8d8';
   const outlierDetectorColor = '#ff0000';
   const boxPlotColor = '#404040';

   // plot parameters
   const yMidVec = Vector.zeros(sample.length);
   const yBottom = -1;
   const yBottomVec = Vector.fill(yBottom, statNum);
   const yTop = 3.3;
   const yTopVec = Vector.fill(yTop, statNum);

   // compute coordinates of plot elements and limits
   let outLeft, outRight, statValues, limX, Q1, Q2, Q3, m;
   $: {
      Q1 = stats.quartiles[0];
      Q2 = stats.quartiles[1];
      Q3 = stats.quartiles[2];
      const mn = stats.range[0];
      const mx = stats.range[1];
      m = stats.mean;

      // other reactive parameters
      outLeft = Q1 - (Q3 - Q1) * 1.5;
      outRight = Q3 + (Q3 - Q1) * 1.5;
      limX = [min([min(sample), outLeft]) - 2, max([max(sample), outRight]) + 2];
      statValues = vector([mn, Q1, Q2, Q3, mx]);
   }

</script>

<Axes xLabel="IQ" {limX} {limY} margins={[0.8, 0.02, 0.02, 0.02]}>

   <!-- statistics -->
   <Segments xStart={statValues} xEnd={statValues} yStart={yBottomVec} yEnd={yTopVec} lineColor={statLineColor} />
   <Points xValues={statValues} yValues={yBottomVec} borderColor="transparent" faceColor={statLineColor} />
   <TextLabels xValues={statValues} yValues={yBottomVec} labels={statLabels} pos={1} />

   <!-- left boundary for outliers -->
   <Segments xStart={[Q1]} xEnd={[outLeft]} yStart={[yTop]} yEnd={[yTop]} lineColor={outlierDetectorColor} />
   <TextLabels xValues={[Q1, outLeft]} yValues={[yTop, yTop]} labels={['●','|']} pos={0} faceColor={outlierDetectorColor} />
   <TextLabels xValues={[mean([Q1, outLeft])]} yValues={[yTop]} labels={['Q1 - 1.5 IQR']} pos={3} faceColor="darkred" />

   <!-- right boundary for outliers -->
   <Segments xStart={[Q3]} xEnd={[outRight]} yStart={[yTop]} yEnd={[yTop]} lineColor={outlierDetectorColor} />
   <TextLabels xValues={[Q3,outRight]} yValues={[yTop, yTop]} labels={["●","|"]} pos={0} faceColor={outlierDetectorColor} />
   <TextLabels xValues={[mean([Q3, outRight])]} yValues={[yTop]} labels={["Q3 + 1.5 IQR"]} pos={3} faceColor="darkred" />

   <!-- sample points -->
   <Points xValues={sample} yValues={yMidVec} faceColor="transparent"
      borderColor={colors.plots.SAMPLES[0]} markerSize={1.5} borderWidth={2} />

   <!-- boxplot and mean -->
   <BoxAndWhiskers
      quartiles={stats.quartiles}
      range={stats.range}
      outliers={stats.outliers}
      boxPosition={2}
      boxSize={1}
      horizontal={true}
      lineWidth={1.5}
      borderColor={boxPlotColor}
   />
   <Segments xStart={[m]} xEnd={[m]} yStart={[2.5]} yEnd={[1.5]} lineColor={boxPlotColor} lineWidth={1.3} lineType={3} />

   <XAxis slot="xaxis" />
</Axes>



