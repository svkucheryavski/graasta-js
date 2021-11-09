<script>
   import { seq, sum, min } from "stat-js";
   import {Axes, TextLabels } from "svelte-plots-basic"
   import SampleSeries from "./SampleSeries.svelte";

   export let sample;
   export let tail;
   export let value;
   export let colors;

   // sample size, number of heads and tails
   $: n = sample.length;
   $: nH = sum(sample);
   $: nT = n - nH;

   // create all possible outcomes for given sample size
   let outcomes = [];
   $: outcomes = seq(0, 2 ** n - 1).map(v => [...((v>>>0).toString(2).padStart(n, "0"))].map(v => v === "1"));
   $: N = outcomes.length;

   // find extremes for head (head means true)
   // both:  H0: P(H) =  0.5
   // left:  H0: P(H) <= 0.5
   // right: H0: P(H) >= 0.5

   let outcomes1 = [], outcomes2 = [], outcomes3 = [];
   let N1 = 0, N2 = 0, N3 = 0;

   $: {
      if (tail == "left") {
         outcomes1 = outcomes.filter(v => sum(v) == nH);
         outcomes2 = outcomes.filter(v => sum(v) < nH);
         outcomes3 = outcomes.filter(v => sum(v) > nH);
      } else if (tail == "right") {
         outcomes1 = outcomes.filter(v => sum(v) == nH);
         outcomes2 = outcomes.filter(v => sum(v) > nH);
         outcomes3 = outcomes.filter(v => sum(v) < nH);
      } else {
         outcomes1 = outcomes.filter(v => sum(v) == min([nH, nT]) | (nH + nT - sum(v)) == min([nH, nT]));
         outcomes2 = outcomes.filter(v => sum(v) < min([nH, nT]) | (nH + nT - sum(v)) < min([nH, nT]));
         outcomes3 = outcomes.filter(v => !(sum(v) <= min([nH, nT]) | (nH + nT - sum(v)) <= min([nH, nT])));
      }

      N1 = outcomes1.length;
      N2 = outcomes2.length;
      N3 = outcomes3.length;
      value = [N1, N2, N3];
   }

   $: limY = n == 4 ? [-1.5, N + 1] : [-4.5, N + 0.5]
   $: mYPos = n == 4 ? [-1] : [-2];
   $: mSize = n == 4 ? 2 : 1;
</script>


   <Axes limX={[0, n + 1]} limY={limY}>
      {#each outcomes2 as outcome, i}
      <SampleSeries sample={outcome} yPos={i} markerSize={mSize} />
      {/each}
      <TextLabels textSize={1.3} xValues={[n/2 + 0.5]} yValues={mYPos} faceColor={colors[0]} labels={"more extreme: " + N2} />
   </Axes>

   <Axes limX={[0, n + 1]} limY={limY}>
      {#each outcomes1 as outcome, i}
      <SampleSeries sample={outcome} yPos={i} markerSize={mSize} />
      {/each}
      <TextLabels textSize={1.3} xValues={[n/2 + 0.5]} yValues={mYPos} faceColor={colors[1]} labels={"equally extreme: " + N1} />
   </Axes>

   <Axes limX={[0, n + 1]} limY={limY}>
      {#each outcomes3 as outcome, i}
      <SampleSeries sample={outcome} yPos={i} markerSize={mSize} />
      {/each}
      <TextLabels textSize={1.3} xValues={[n/2 + 0.5]} yValues={mYPos} faceColor={colors[2]} labels={"less extreme: " + N3} />
   </Axes>

