<script>
   import { mrange } from 'mdatools/stat';
   import { Axes, XAxis, TextLegend, Segments } from 'svelte-plots-basic/2d';

   import { formatLabels } from '../graasta';

   export let limX = undefined;
   export let limY = [-1, 1.1];

   export let effectExpected;
   export let effectObserved;
   export let ci;

   export let expectedEffectColor = '#a0a0a0';
   export let ciColor = '#606060';

   export let se = null;
   export let showLegend = true;
   export let xLabel = '';

   $: limXLocal = limX === undefined ? mrange([ci[0], ci[1], effectExpected], 0.1) : limX;
   $: legendElements = formatLabels([
         { name: 'observed effect', value: effectObserved.toFixed(2) },
         { name: 'standard error', value: se.toFixed(2) }
   ]);
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={limXLocal} {limY} {xLabel} margins={[0.5, 0.05, 0.025, 0.05]}>

   <!-- statistics -->
   {#if showLegend}
   <TextLegend textSize={1.15} left={limXLocal[0]} top={0.85} dx="2em" dy="1.35em" elements={legendElements} />
   {/if}

   {#if effectExpected !== null}
   <Segments xStart={[effectExpected]} xEnd={[effectExpected]} yStart={[-1]} yEnd={[1]} lineType={3} lineColor={expectedEffectColor} />
   {/if}

   <Segments xStart={[ci[0]]} xEnd={[ci[1]]} yStart={[-0.1]} yEnd={[-0.1]} lineColor={ciColor} />
   <Segments xStart={ci} xEnd={ci} yStart={[-0.2, -0.2]} yEnd={[0.0, 0.0]} lineColor={ciColor}/>
   <Segments xStart={[effectObserved]} xEnd={[effectObserved]} yStart={[-0.2]} yEnd={[0.0]} lineColor={ciColor} />

   <slot></slot>
   <XAxis slot="xaxis" ></XAxis>
</Axes>

