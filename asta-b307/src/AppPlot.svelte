<script>
   import {max, min, mrange, seq} from 'mdatools/stat';
   import {polypredict} from 'mdatools/models';
   import {Axes, XAxis, YAxis, ScatterSeries, LineSeries, TextLegend} from 'svelte-plots-basic';
   import { colors } from "../../shared/graasta";

   export let popModel;
   export let globalModel;
   export let localModel;
   export let indSeg;

   const colorPop = "#f0f0f0";
   const colorGlobal = colors.plots.SAMPLES[0] + "70";
   const colorLocalVal = colors.plots.SAMPLES[0];
   const colorLocalValLight = colors.plots.SAMPLES[0] + "70";

   let xLocal = [];
   let yLocal = [];
   let xLocalVal = [];
   let yLocalVal = [];
   let textLocal = [];
   let lineYLocal = []

   // function for getting strings with model info
   function getModelString(m, name, color) {
      if (!color) color = "#336688";

      return [`<tspan font-weight=bold>${name}:</tspan>`,
            'y =  ' + m.coeffs.estimate.map((b, p) =>
            (p > 0 ? '+' : '') +
            ' <tspan fill="' + color + '" font-weight=bold>' + b.toFixed(2) + '</tspan>' +
            (p > 0 ? '<tspan dx="0.05em" font-weight=bold>x</tspan>' : '') +
            (p > 1 ? '<tspan font-size="70%" baseline-shift = "super">' + p + '</tspan>' : '')
            ).join(" ")
      ];
   }

   // points and statistics for population model
   $: xPop = popModel.data.X[0];
   $: yPop = popModel.data.y;
   $: lineXPop = seq(min(xPop), max(xPop), 100);
   $: textPop = getModelString(popModel, "Population model", "#909090");
   $: lineYPop = polypredict(popModel, lineXPop);

   // points and statistics for global model
   $: xGlobal = globalModel.data.X[0];
   $: yGlobal = globalModel.data.y;
   $: lineX = seq(min(xGlobal), max(xGlobal), 100);
   $: textGlobal = getModelString(globalModel, "Global model", colorLocalVal + "b0");
   $: lineYGlobal = polypredict(globalModel, lineX);


   // points and statistics for current local model
   $: if (localModel !== undefined) {
      xLocal = localModel.data.X[0];
      yLocal = localModel.data.y;
      textLocal = indSeg >= 0 ? getModelString(localModel, "Local model", colorLocalVal) : "";
      lineYLocal = polypredict(localModel, lineX);
      xLocalVal = [xGlobal[indSeg]];
      yLocalVal = [yGlobal[indSeg]];
   }

</script>

<Axes limX={mrange(xPop)} limY={mrange(yPop)} xLabel="x" yLabel="y">

   <!-- population model -->
   <ScatterSeries xValues={xPop} yValues={yPop} borderWidth={1} faceColor={colorPop} borderColor={colorPop}/>
   <LineSeries xValues={lineXPop} yValues={lineYPop} lineColor="#c0c0c0" lineType={3} />
   <TextLegend textSize={1.05} left={min(xPop)} top={max(yPop)} dx="1em" dy="1.35em" elements={textPop} />

   <!-- global model -->
   <ScatterSeries xValues={xGlobal} yValues={yGlobal} borderWidth={1} faceColor={colorGlobal} borderColor={colorGlobal}/>
   <LineSeries xValues={lineX} yValues={lineYGlobal} lineColor={colorGlobal} />
   <TextLegend textSize={1.05} left={min(xPop)} top={max(yPop) - 2} dx="1em" dy="1.35em" elements={textGlobal} />

   <!-- local model -->
   {#if localModel !== undefined && indSeg >= 0}
      <!-- <ScatterSeries xValues={xLocal} yValues={yLocal} markerSize={1.2} borderWidth={2} borderColor={colorLocal}/> -->
      <ScatterSeries xValues={xLocalVal} yValues={yLocalVal} borderWidth={2} markerSize={1.2} faceColor={colorLocalValLight}/>
      <ScatterSeries xValues={xLocalVal} yValues={yLocalVal} borderWidth={2} markerSize={1.2} borderColor={colorLocalVal}/>
      <LineSeries xValues={lineX} yValues={lineYLocal} lineColor={colorLocalVal} />
      <TextLegend textSize={1.05} left={min(xPop) * 0.55 + max(xPop) * 0.45} top={min(yPop) * 0.9 + max(yPop) * 0.1} dx="1em" dy="1.35em" elements={textLocal} />
   {/if}

   <XAxis slot="xaxis" />
   <YAxis slot="yaxis" />
</Axes>
