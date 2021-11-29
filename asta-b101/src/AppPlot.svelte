<script>
   import {max, quantile, mean, min} from 'stat-js';
   import {Axes, XAxis, Segments, TextLabels, ScatterSeries} from 'svelte-plots-basic';

   // shared components
   import {colors} from "../../shared/graasta";
   import BoxAndWhiskers from "../../shared/plots/BoxAndWhiskers.svelte";

   export let values;

   // fixed values
   const statLabels = ["min", "Q1", "Q2", "Q3", "max"];
   const limY = [-2, 3.8];
   const statNum = statLabels.length;
   const statLineColor = "#d8d8d8";
   const outlierDetectorColor = "#ff0000";
   const boxPlotColor = "#404040";

   // plot parameters
   const yMid = Array.from({length: values.length}, () => 0);
   const yBottom = Array.from({length: statNum}, () => -1);
   const yTop = Array.from({length: statNum}, () => 3.3);

   // statistics
   $: m = mean(values);
   $: Q1 = quantile(values, 0.25);
   $: Q2 = quantile(values, 0.50);
   $: Q3 = quantile(values, 0.75);

   // other reactive parameters
   $: outLeft = Q1 - (Q3 - Q1) * 1.5;
   $: outRight = Q3 + (Q3 - Q1) * 1.5;
   $: limX = [min(values.concat([outLeft])) - 2, max(values.concat([outRight])) + 2];
   $: statValues = [min(values), Q1, Q2, Q3, max(values)];
</script>

<Axes xLabel="IQ" limX={limX} limY="{limY}">

   <!-- statistics -->
   <Segments xStart="{statValues}" xEnd="{statValues}" yStart="{yBottom}" yEnd="{yTop}" lineColor={statLineColor} />
   <ScatterSeries xValues="{statValues}" yValues="{yBottom}" borderColor="transparent" faceColor={statLineColor} />
   <TextLabels xValues={statValues} yValues={yBottom} labels={statLabels} pos={1} ></TextLabels>

   <!-- left boundary for outliers -->
   <Segments xStart="{[Q1]}" xEnd="{[outLeft]}" yStart="{[yTop[0]]}" yEnd="{[yTop[0]]}" lineColor={outlierDetectorColor} />
   <TextLabels xValues="{[Q1, outLeft]}" yValues="{[yTop[0], yTop[0]]}" labels="{["●", "|"]}" pos={0} faceColor={outlierDetectorColor} />
   <TextLabels xValues="{[mean([Q1, outLeft])]}" yValues="{[yTop[0]]}" labels="{["Q1 - 1.5 IQR"]}" pos={3} faceColor="darkred" />

   <!-- right boundary for outliers -->
   <Segments xStart="{[Q3]}" xEnd="{[outRight]}" yStart="{[yTop[0]]}" yEnd="{[yTop[0]]}" lineColor="red" />
   <TextLabels xValues="{[Q3, outRight]}" yValues="{[yTop[0], yTop[0]]}" labels="{["●", "|"]}" pos={0} faceColor="red" />
   <TextLabels xValues="{[mean([Q3, outRight])]}" yValues="{[yTop[0]]}" labels="{["Q3 + 1.5 IQR"]}" pos={3} faceColor="darkred" />

   <!-- sample points -->
   <ScatterSeries xValues={values} yValues={yMid} faceColor="transparent"
      borderColor="{colors.plots.SAMPLES[0]}" markerSize={1.5} borderWidth="{2}" />

   <!-- boxplot and mean -->
   <BoxAndWhiskers values={values} boxPosition={2} boxSize={1} horizontal={true} lineWidth={1.5} borderColor="{boxPlotColor}" />
   <Segments xStart="{[m]}" xEnd="{[m]}" yStart="{[2.5]}" yEnd="{[1.5]}" lineColor="{boxPlotColor}" lineWidth={1.3} lineType={3} />

   <XAxis slot="xaxis" />
</Axes>



