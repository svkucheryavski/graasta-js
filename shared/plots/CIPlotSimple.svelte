<script>
   import {mrange} from 'stat-js';
   import {Axes, XAxis, TextLegend, Segments} from 'svelte-plots-basic';

   export let limX = null;
   export let limY = [-1, 1];

   export let effectExpected;
   export let effectObserved;
   export let ci;

   export let expectedEffectColor = "#000000";
   export let ciColor = "#606060";

   export let se = null;
   export let showLegend = true;
   export let xLabel = "";
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={limX === null ? mrange([ci[0], ci[1], effectExpected], 0.1) : limX} {limY} {xLabel}>

   <!-- statistics -->
   {#if showLegend}
   <TextLegend textSize={1.05} x={0} y={0.85} pos={2} dx="2em" dy="1.35em" elements = {[
         "observed effect: " + effectObserved.toFixed(2),
         se !== null ? "standard error: " + se.toFixed(2) : ""
   ]} />
   {/if}

   {#if effectExpected !== null}
   <Segments xStart={[effectExpected]} xEnd={[effectExpected]} yStart={[-1]} yEnd={[1]} lineType={3} lineColor={expectedEffectColor} />
   {/if}

   <Segments xStart={[ci[0]]} xEnd={[ci[1]]} yStart={[0]} yEnd={[0]} lineColor={ciColor} />
   <Segments xStart={ci} xEnd={ci} yStart={[-0.1, -0.1]} yEnd={[0.1, 0.1]} lineColor={ciColor}/>
   <Segments xStart={[effectObserved]} xEnd={[effectObserved]} yStart={[-0.1]} yEnd={[0.1]} lineColor={ciColor} />

   <slot></slot>
   <XAxis slot="xaxis" ></XAxis>
</Axes>

