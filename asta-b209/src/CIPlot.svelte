<script>
   /*****************************************************
    * Confidence intervals for two-sample t-test        *
    *****************************************************/

   import {sd, mean, qt} from 'stat-js';
   import {Axes, XAxis, TextLegend, Segments} from 'svelte-plots-basic';

   export let samples;
   export let DoF;
   export let effectExpected = null;
   export let showLegend = true;
   export let colors = ["#909090", "#202020", "#000000"];
   export let alpha = 0.05;

   // critical t-value
   $: tCrit = qt(1 - alpha/2, DoF);

   // compute sample statistics
   $: effectObserved = mean(samples[1]) - mean(samples[0]);
   $: SE = Math.sqrt((sd(samples[1])**2 + sd(samples[0])**2) / samples[0].length);
   $: CI = [effectObserved - tCrit * SE, effectObserved + tCrit * SE];
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={[-60, 60]} limY={[-0.25, showLegend ? 1 : 0.25]} xLabel={"Expected value for  (µ<sub>1</sub> – µ<sub>2</sub>)"}>

   <!-- statistics -->
   {#if showLegend}
   <TextLegend textSize={1.05} x={90} y={0.85} pos={2} dx="2em" dy="1.35em" elements = {[
         "observed effect: " + effectObserved.toFixed(2),
         "observed noise (se): " + SE.toFixed(2)
   ]} />
   {/if}

   <Segments xStart={[0]} xEnd={[0]} yStart={[-1]} yEnd={[1]} lineType={2} lineColor={colors[1]} />

   {#if effectExpected !== null}
   <Segments xStart={[effectExpected]} xEnd={[effectExpected]} yStart={[-1]} yEnd={[1]} lineType={3} lineColor={colors[2]} />
   {/if}

   <Segments xStart={[CI[0]]} xEnd={[CI[1]]} yStart={[0]} yEnd={[0]} lineColor={colors[0]} />
   <Segments xStart={CI} xEnd={CI} yStart={[-0.1, -0.1]} yEnd={[0.1, 0.1]} lineColor={colors[0]}/>
   <Segments xStart={[effectObserved]} xEnd={[effectObserved]} yStart={[-0.1]} yEnd={[0.1]} lineColor={colors[0]} />

   <XAxis slot="xaxis" ></XAxis>
</Axes>

