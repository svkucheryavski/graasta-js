<script>
   import {Axes, TextLabels } from "svelte-plots-basic";
   import { formatLabels } from "../../shared/graasta.js";
   import SampleSeries from "./SampleSeries.svelte";

   export let outcomes;
   export let name = "xxx";
   export let sampSize;
   export let mSize;

   $: N = outcomes.length;
   $: limY = sampSize == 4 ? [-1.5, 2 ** sampSize + 1] : [-4.5, 2 ** sampSize  + 0.5]
   $: mYPos = sampSize == 4 ? [-1] : [-2];
   $: mSize = sampSize == 4 ? 2 : 1;
</script>


<Axes limX={[0, sampSize + 1]} limY={limY}>
   {#each outcomes as outcome, i}
   <SampleSeries sample={outcome} yPos={i} markerSize={mSize} />
   {/each}
   <TextLabels textSize={1 + (mSize + 1) /10} xValues={[sampSize/2 + 0.5]} yValues={mYPos} labels={formatLabels([{name: name, value: N}])} />
</Axes>

