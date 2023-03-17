<script>
   import { Vector } from 'mdatools/arrays';
   import { max, min, mrange } from 'mdatools/stat';
   import { polypredict } from 'mdatools/models';
   import { Axes, XAxis, YAxis, Points, Lines, TextLegend } from 'svelte-plots-basic/2d';

   import { colors, getModelString, getStatString } from '../../shared/graasta.js';

   export let globalModel;
   export let localModel;
   export let indSeg;
   export let splits;
   export let statCV;

   const colorGlobal = colors.plots.SAMPLES[0] + '70';
   const colorLocal = colors.plots.SAMPLES[0] + '50';
   const colorLocalVal = colors.plots.SAMPLES[0];

   // const colorGlobal = colors.plots.SAMPLES[0] + "60";
   // const colorLocal = colors.plots.SAMPLES[0] ;
   // const colorLocalVal = "#ff0000";

   let xLocal = [];
   let yLocal = [];
   let xLocalVal = [];
   let yLocalVal = [];
   let textLocal = [];
   let lineYLocal = []


   // points and statistics for global model
   $: xGlobal = globalModel.data.X.getcolumn(1);
   $: yGlobal = globalModel.data.y;
   $: lineX = Vector.seq(min(xGlobal), max(xGlobal), 1/100);
   $: textGlobal = getModelString(globalModel, "Global model", colorLocalVal + "a0").concat(getStatString(globalModel.stat));
   $: lineYGlobal = polypredict(globalModel, lineX);

   // points and statistics for current local model
   $: if (localModel !== undefined) {
      xLocal = localModel.data.X[0];
      yLocal = localModel.data.y;
      textLocal = indSeg >= 0 ?
         getModelString(localModel, "Local model", colorLocalVal) :
         ["<tspan font-weight=bold>CV performance:</tspan>"].concat(getStatString(statCV));
      lineYLocal = polypredict(localModel, lineX);

      const indVal = splits.which(v => v === indSeg);
      xLocalVal = xGlobal.subset(indVal);
      yLocalVal = yGlobal.subset(indVal);
   }

</script>

<Axes limX={mrange(xGlobal)} limY={mrange(yGlobal)} xLabel="x" yLabel="y" margins={[0.5, 0.65, 0.15, 0.15]}>

   <!-- text for global model -->
   <TextLegend textSize={1.05} left={min(xGlobal)} top={max(yGlobal)} dx="1em" dy="1.35em" elements={textGlobal} />

   <!-- local model -->
   {#if localModel !== undefined && indSeg >= 0}
      <!-- line and points for global model shown pale -->
      <Lines xValues={lineX} yValues={lineYGlobal} lineColor={colorLocal} />
      <Points xValues={xGlobal} yValues={yGlobal} borderWidth={1} faceColor={colorLocal} borderColor={colorLocal} />

      <!-- line, text and validation points for local model  -->
      <Points xValues={xLocalVal} yValues={yLocalVal} borderWidth={2} markerSize={1.2} borderColor={colorLocalVal}/>
      <Lines xValues={lineX} yValues={lineYLocal} lineColor={colorLocalVal} />
      <TextLegend textSize={1.05} left={min(xGlobal) * 0.55 + max(xGlobal) * 0.45} top={min(yGlobal) * 0.8 + max(yGlobal) * 0.2} dx="1em" dy="1.35em" elements={textLocal} />
   {:else}
      <!-- global model -->
      <Points xValues={xGlobal} yValues={yGlobal} borderWidth={1} faceColor={colorGlobal} borderColor={colorGlobal}/>
      <Lines xValues={lineX} yValues={lineYGlobal} lineColor={colorGlobal} />
   {/if}

   <!-- CV performance for the loop is over -->
   {#if statCV !== undefined}
      <TextLegend textSize={1.05} left={min(xGlobal) * 0.45 + max(xGlobal) * 0.55} top={min(yGlobal) * 0.8 + max(yGlobal) * 0.2} dx="1em" dy="1.35em" elements={textLocal} />
   {/if}

   <XAxis slot="xaxis" />
   <YAxis slot="yaxis" />
</Axes>
