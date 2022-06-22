<script>
   import {max, min, mrange, subset, seq} from 'mdatools/stat';
   import {polypredict} from 'mdatools/models';
   import {Axes, XAxis, YAxis, ScatterSeries, LineSeries, TextLegend} from 'svelte-plots-basic';
   import { colors } from "../../shared/graasta";

   export let globalModel;
   export let localModel;
   export let indSeg;
   export let segments;
   export let statCV;

   const colorGlobal = colors.plots.SAMPLES[0] + "60";
   const colorLocal = colors.plots.SAMPLES[0] ;
   const colorLocalVal = "#ff0000";

   let xLocal = [];
   let yLocal = [];
   let xLocalVal = [];
   let yLocalVal = [];
   let textLocal = [];
   let lineYLocal = []

   // function for getting strings with model info
   function getModelString(m, name) {
      return [`<tspan font-weight=bold>${name}:</tspan>`,
            'y =  ' + m.coeffs.estimate.map((b, p) =>
            (p > 0 ? '+' : '') +
            ' <tspan fill="#0000ff" font-weight=bold>' + b.toFixed(2) + '</tspan>' +
            (p > 0 ? '<tspan font-weight=bold>x</tspan>' : '') +
            (p > 1 ? '<tspan font-size="70%" baseline-shift = "super">' + p + '</tspan>' : '')
            ).join(" ")
      ];
   }

   // function for getting strings with prediction statistics
   function getStatString(s) {
      return [
      `s(e) =  <tspan font-weight=bold>${s.se.toFixed(2)}</tspan>`,
      `R2 =  <tspan font-weight=bold>${s.R2.toFixed(3)}</tspan>`];
   }

   // points and statistics for global model
   $: xGlobal = globalModel.data.X[0];
   $: yGlobal = globalModel.data.y;
   $: lineX = seq(min(xGlobal), max(xGlobal), 100);
   $: textGlobal = getModelString(globalModel, "Global model").concat(getStatString(globalModel.stat));
   $: lineYGlobal = polypredict(globalModel, lineX);

   // points and statistics for current local model
   $: if (localModel !== undefined) {
      xLocal = localModel.data.X[0];
      yLocal = localModel.data.y;
      textLocal = indSeg >= 0 ? getModelString(localModel, "Local model") :
         ["<tspan font-weight=bold>CV performance:</tspan>"].concat(getStatString(statCV));
      lineYLocal = polypredict(localModel, lineX);
      xLocalVal = subset(xGlobal, segments.val[indSeg]);
      yLocalVal = subset(yGlobal, segments.val[indSeg]);
   }

</script>

<Axes limX={mrange(xGlobal)} limY={mrange(yGlobal)} xLabel="x" yLabel="y">

   <!-- global model -->
   <ScatterSeries xValues={xGlobal} yValues={yGlobal} borderWidth={1} faceColor={colorGlobal} borderColor={colorGlobal}/>
   <LineSeries xValues={lineX} yValues={lineYGlobal} lineColor={colorGlobal}></LineSeries>
   <TextLegend textSize={1.05} left={min(xGlobal)} top={max(yGlobal)} dx="1em" dy="1.35em" elements={textGlobal} />

   <!-- local model -->
   {#if localModel !== undefined && indSeg >= 0}
   <ScatterSeries xValues={xLocal} yValues={yLocal} markerSize={1.2} borderWidth={2} borderColor={colorLocal}/>
   <ScatterSeries xValues={xLocalVal} yValues={yLocalVal} borderWidth={2} markerSize={1.2} borderColor={colorLocalVal}/>
   <LineSeries xValues={lineX} yValues={lineYLocal} lineColor={colorLocal}></LineSeries>
      <TextLegend textSize={1.05} left={min(xGlobal) * 0.55 + max(xGlobal) * 0.45} top={min(yGlobal) * 0.8 + max(yGlobal) * 0.2} dx="1em" dy="1.35em" elements={textLocal} />
   {/if}

   <!-- CV performance for the loop is over -->
   {#if statCV !== undefined}
      <TextLegend textSize={1.05} left={min(xGlobal) * 0.45 + max(xGlobal) * 0.55} top={min(yGlobal) * 0.8 + max(yGlobal) * 0.2} dx="1em" dy="1.35em" elements={textLocal} />
   {/if}

   <XAxis slot="xaxis" />
   <YAxis slot="yaxis" />
   <slot>

   </slot>
</Axes>
