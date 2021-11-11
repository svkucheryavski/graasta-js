<script>
   import {sd, mean} from 'stat-js';
   import {Axes, XAxis, TextLegend, Segments} from 'svelte-plots-basic';

   export let samples;
   export let effectExpected;

   // critical t-values
   const tCrit = {3: 2.7764, 5: 2.3060, 10: 2.1001, 30: 2.0002};

   // compute sample statistics
   $: sampSize = samples[0].length;
   $: effectObserved = mean(samples[1]) - mean(samples[0]);
   $: SE = Math.sqrt((sd(samples[1])**2 + sd(samples[0])**2) / samples[0].length);
   $: CI = [effectObserved - tCrit[sampSize] * SE, effectObserved + tCrit[sampSize] * SE];
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={[-60, 60]} limY={[-0.25, 1]} xLabel={"Expected value for  (µ<sub>1</sub> – µ<sub>2</sub>)"}>

   <!-- statistics -->
   <TextLegend textSize={1.05} x={90} y={0.85} pos={2} dx="2em" dy="1.35em" elements = {[
         "observed effect: " + effectObserved.toFixed(2),
         "observed noise (se): " + SE.toFixed(2)
   ]} />

   <Segments xStart={[0]} xEnd={[0]} yStart={[-1]} yEnd={[1]} lineType={2} lineColor="#909090" />
   <Segments xStart={[effectExpected]} xEnd={[effectExpected]} yStart={[-1]} yEnd={[1]} lineType={3} lineColor="#000000" />

   <Segments xStart={[CI[0]]} xEnd={[CI[1]]} yStart={[0]} yEnd={[0]} lineColor="#202020" />
   <Segments xStart={CI} xEnd={CI} yStart={[-0.1, -0.1]} yEnd={[0.1, 0.1]} lineColor="#202020"/>
   <Segments xStart={[effectObserved]} xEnd={[effectObserved]} yStart={[-0.1]} yEnd={[0.1]} lineColor="#202020" />

   <XAxis slot="xaxis" ></XAxis>
</Axes>

