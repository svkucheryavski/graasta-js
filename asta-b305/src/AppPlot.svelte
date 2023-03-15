<script>
   import { Vector } from 'mdatools/arrays';
   import { max, min, mrange } from 'mdatools/stat';
   import { polypredict } from 'mdatools/models';

   import { Axes, XAxis, YAxis, Points, Lines, TextLegend} from 'svelte-plots-basic/2d';

   import { colors, getModelString } from '../../shared/graasta.js';

   export let popModel;
   export let sampModel;
   export let reset;

   let popColor = '#f0f0f0';
   let sampColor = colors.plots.SAMPLES[0];
   let popLineColor = '#a0a0a0';


   let sampLineY = [];

   // population and sample regression lines
   $: popX = popModel.data.X.getcolumn(1);
   $: popY = popModel.data.y;
   $: lineX = Vector.seq(min(popX), max(popX), 1/100);
   $: popLineY = polypredict(popModel, lineX);
   $: popText = getModelString(popModel, 'Population', '#a0a0a0');

   // points and statistics for sample
   $: sampX = sampModel.data.X.getcolumn(1);
   $: sampY = sampModel.data.y;
   $: sampText = getStatString(sampModel, 'Sample', sampColor);
   $: sampLineY = reset ? [polypredict(sampModel, lineX)] : [...sampLineY, polypredict(sampModel, lineX)] ;
</script>

<Axes limX={mrange(popX)} limY={mrange(popY)} margins={[0.75, 0.75, 0.25, 0.25]}
   xLabel="Predictor (x), mean centred" yLabel="Response (y)">


   <Points title="population" xValues={popX} borderColor={popColor} faceColor={popColor} yValues={popY} />
   <Lines xValues={lineX} yValues={popLineY} lineColor={popLineColor} />

   <Points title="sample" xValues={sampX} yValues={sampY} borderWidth={2} borderColor={sampColor} />

   {#each sampLineY as sly, i}
   <Lines xValues={lineX} yValues={sly} lineColor={sampColor + (i < (sampLineY.length - 1) ? "20" : "F0")} />
   {/each}

   <!-- models -->
   <TextLegend textSize={1.05} left={min(popX)} top={max(popY)} dx="1em" dy="1.35em" elements={popText} />
   <TextLegend textSize={1.05} left={min(popX) * 0.7 + max(popX) * 0.3} top={min(popY) * 0.9 + max(popY) * 0.1}
      dx="1em" dy="1.35em" elements={sampText} />

   <XAxis slot="xaxis" />
   <YAxis slot="yaxis" />
   <slot>

   </slot>
</Axes>
