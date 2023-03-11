<script>
   import { max} from 'mdatools/stat';
   import { Axes, XAxis, Lines, Area, TextLegend, Segments } from 'svelte-plots-basic/2d';
   import { formatLabels } from '../../shared/graasta';


   export let x;
   export let f;

   export let ci;
   export let cix;
   export let cif;
   export let ciStat;

   export let limX = [-0.02, 1.02]; // default value is suitable for proportions CIs

   export let lineColor = '#000000';
   export let mainColor = '#6f6666';

   export let errmsg = '';
   export let labelStr = '# samples inside CI';
   export let xLabel = 'Expected sample statistic';
   export let reset = false;
   export let clicked;

   let nSamples = 0;
   let nSamplesInside = 0;

   $: {

      // this is needed to force CI plot stats when two consequent samples are the same
      clicked;

      // when sample size or population properties changed - reset statistics
      if (reset) {
         nSamples = 0;
         nSamplesInside = 0;
      }

      nSamples = nSamples + 1;
      nSamplesInside = nSamplesInside + (ciStat >= ci[0] && ciStat <= ci[1] ? 1 : 0);
   }

   // text values for stat table
   $: labelsStr = formatLabels([
      {name: '95% CI', value: `[${ci[0].toFixed(2)}, ${ci[1].toFixed(2)}]`},
      {name: labelStr, value: `${nSamplesInside}/${nSamples} (${(nSamplesInside/nSamples * 100).toFixed(1)}%)`}
   ])
</script>

<!-- plot with population based CI and position of current sample proportion -->
{#if errmsg === ''  }
   <Axes {limX} limY={[-0.01, max(f) * 1.50]} {xLabel} margins={[0.5, 0.05, 0.5, 0.05]}>
      <!-- legend -->
      <TextLegend textSize={1.15} left={limX[0]} top={max(f) * 1.40} dx="1.25em" elements = {labelsStr} />

      <!-- PDF and intervaæ  -->
      <Area xValues={cix} yValues={cif} lineColor={mainColor + "40"} fillColor={mainColor + "40"}/>
      <Lines xValues={x} yValues={f} lineColor={mainColor + "40"} />

      <!-- vertical line with statistic-->
      <Segments xStart={[ciStat]} xEnd={[ciStat]} yStart={[0]} yEnd={[max(f)]} lineColor={lineColor} />
      <XAxis slot="xaxis" ></XAxis>
   </Axes>
{:else}
   <div class="error">{errmsg}</div>
{/if}

<style>
   .error{
      padding: 2em;
      text-align: center;
      line-height: 1.25em;
      color: #aa3311;
   }
</style>