<script>
   import { Vector } from 'mdatools/arrays';
   import { max, min, mrange } from 'mdatools/stat';
   import { polypredict } from 'mdatools/models';

   import {Axes, XAxis, YAxis, Points, Lines, TextLegend} from 'svelte-plots-basic/2d';

   import { colors, getModelString } from '../../shared/graasta';

   export let popModel;
   export let globalModel;
   export let localModel;
   export let indSeg;

   const colorPop = '#f0f0f0';
   const colorGlobal = colors.plots.SAMPLES[0] + '70';
   const colorLocalVal = colors.plots.SAMPLES[0];
   const colorLocalValLight = colors.plots.SAMPLES[0] + '70';

   let xLocal = [];
   let yLocal = [];
   let xLocalVal = [];
   let yLocalVal = [];
   let textLocal = [];
   let lineYLocal = []


   // points and statistics for population model
   $: xPop = popModel.data.X.getcolumn(1);
   $: yPop = popModel.data.y;
   $: lineXPop = Vector.seq(min(xPop), max(xPop), 1/100);
   $: textPop = getModelString(popModel, 'Population model', '#909090');
   $: lineYPop = polypredict(popModel, lineXPop);

   // points and statistics for global model
   $: xGlobal = globalModel.data.X.getcolumn(1);
   $: yGlobal = globalModel.data.y;
   $: lineX = Vector.seq(min(xGlobal), max(xGlobal), 1/100);
   $: textGlobal = getModelString(globalModel, 'Global model', colorLocalVal + 'b0');
   $: lineYGlobal = polypredict(globalModel, lineX);


   // points and statistics for current local model
   $: if (localModel !== undefined) {
      xLocal = localModel.data.X.getcolumn(1);
      yLocal = localModel.data.y;
      textLocal = indSeg >= 0 ? getModelString(localModel, 'Local model', colorLocalVal) : '';
      lineYLocal = polypredict(localModel, lineX);
      xLocalVal = [xGlobal.v[indSeg]];
      yLocalVal = [yGlobal.v[indSeg]];
   }

</script>

<Axes limX={mrange(xPop)} limY={mrange(yPop)} margins={[0.75, 0.75, 0.25, 0.25]} xLabel="x" yLabel="y">

   <!-- population model -->
   <Points xValues={xPop} yValues={yPop} borderWidth={1} faceColor={colorPop} borderColor={colorPop}/>
   <Lines xValues={lineXPop} yValues={lineYPop} lineColor="#c0c0c0" lineType={3} />
   <TextLegend textSize={1.05} left={min(xPop)} top={max(yPop)} dx="1em" dy="1.35em" elements={textPop} />

   <!-- global model -->
   <Points xValues={xGlobal} yValues={yGlobal} borderWidth={1} faceColor={colorGlobal} borderColor={colorGlobal}/>
   <Lines xValues={lineX} yValues={lineYGlobal} lineColor={colorGlobal} />
   <TextLegend textSize={1.05} left={min(xPop)} top={max(yPop) - 2} dx="1em" dy="1.35em" elements={textGlobal} />

   <!-- local model -->
   {#if localModel !== undefined && indSeg >= 0}
      <Points xValues={xLocalVal} yValues={yLocalVal} borderWidth={2} markerSize={1.2} faceColor={colorLocalValLight}/>
      <Points xValues={xLocalVal} yValues={yLocalVal} borderWidth={2} markerSize={1.2} borderColor={colorLocalVal}/>
      <Lines xValues={lineX} yValues={lineYLocal} lineColor={colorLocalVal} />
      <TextLegend textSize={1.05} left={min(xPop) * 0.55 + max(xPop) * 0.45} top={min(yPop) * 0.9 + max(yPop) * 0.1} dx="1em" dy="1.35em" elements={textLocal} />
   {/if}

   <XAxis slot="xaxis" />
   <YAxis slot="yaxis" />
</Axes>
