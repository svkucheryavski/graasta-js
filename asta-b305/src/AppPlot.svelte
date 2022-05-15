<script>
   import {max, min, seq, mrange} from 'mdatools/stat';
   import {polypredict} from 'mdatools/models';
   import {Axes, XAxis, YAxis, ScatterSeries, LineSeries, TextLegend} from 'svelte-plots-basic';
   import { colors } from "../../shared/graasta";

   export let popModel;
   export let sampModel;
   export let reset;

   let popColor = colors.plots.POPULATIONS[0];
   let sampColor = "#ff2222";
   let popLineColor = "#a0a0a0";
   let sampLineY = [];

   // function to show model info
   function getStatString(m, name, color) {
      return [`<tspan font-weight=bold>${name}:</tspan>`,
            'y =  ' + m.coeffs.estimate.map((b, p) =>
            (p > 0 ? '+' : '') +
            ' <tspan fill="' + color + '" font-weight=bold>' + b.toFixed(2) + '</tspan>' +
            (p > 0 ? '<tspan font-weight=bold>x</tspan>' : '') +
            (p > 1 ? '<tspan font-size="70%" baseline-shift = "super">' + p + '</tspan>' : '')
            ).join(" ")
      ];
   }

   // statistics for population - only for using in this component therefore compute here not in main App

   // population and sample regression lines
   $: popX = popModel.data.X[0];
   $: popY = popModel.data.y;
   $: lineX = seq(min(popX), max(popX), 100);
   $: popLineY = polypredict(popModel, lineX);
   $: popText = getStatString(popModel, "Population", "blue");

   // points and statistics for sample
   $: sampX = sampModel.data.X[0];
   $: sampY = sampModel.data.y;
   $: sampText = getStatString(sampModel, "Sample", sampColor);
   $: sampLineY = reset ? [polypredict(sampModel, lineX)] : [...sampLineY, polypredict(sampModel, lineX)] ;
</script>

<Axes limX={mrange(popX)} limY={mrange(popY)} xLabel="Predictor (x), mean centred" yLabel="Response (y)">


   <ScatterSeries title="population" xValues={popX} borderColor={popColor} yValues={popY} />
   <LineSeries xValues={lineX} yValues={popLineY} lineColor={popLineColor}></LineSeries>

   <ScatterSeries
      title="sample"
      xValues={sampX}
      yValues={sampY}
      borderWidth={2}
      borderColor={sampColor}
   />

   {#each sampLineY as sly, i}
   <LineSeries xValues={lineX} yValues={sly}
      lineColor={sampColor + (i < (sampLineY.length - 1) ? "20" : "F0")}></LineSeries>
   {/each}

   <!-- models -->
   <TextLegend textSize={1.05} left={min(popX)} top={max(popY)} dx="1em" dy="1.35em" elements={popText} />
   <TextLegend textSize={1.05} left={min(popX) * 0.7 + max(popX) * 0.3} top={min(popY) * 0.9 + max(popY) * 0.1} dx="1em" dy="1.35em" elements={sampText} />

   <XAxis slot="xaxis" />
   <YAxis slot="yaxis" />
   <slot>

   </slot>
</Axes>
