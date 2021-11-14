<script>
   import {pt, round, seq, sd, max, dt, mean} from 'stat-js';
   import {Axes, XAxis, LineSeries, AreaSeries, TextLegend, Segments} from 'svelte-plots-basic';

   export let popMean;
   export let popSD;
   export let sample;
   export let colors;
   export let tail;

   // sign symbols for hypothesis tails
   const signs = {"both": "=", "left": "≥", "right": "≤"};

   // variables for collecting cumulative statistics
   let oldTail = tail;
   let oldPopMean = popMean;
   let oldPopSD = popSD;
   let oldSampSize = sample.length;
   let nSamples = 0;
   let nSamplesBelow005 = 0;

   // statistics for current sample
   $: sampSize = sample.length;
   $: sampMean = round(mean(sample), 2);
   $: sampSD = round(sd(sample), 2);
   $: SE = sampSD / Math.sqrt(sampSize);
   $: tValue = -Math.abs((sampMean - popMean) / SE);

   // PDF curve for sampling distribution
   $: x = seq(popMean - 10 * SE, popMean + 10 * SE, 300);
   $: f = dt(x.map(v => (v - popMean) /SE), sampSize - 1);


   // this p-value is always for left half of the PDF and has to be adjusted
   $: pValue = pt(tValue, sampSize - 1);

   // Correct p-value and p-value area
   let px, pf, p;
   $: {
      // compute p-value and coordinates of corresponding area on the plot
      if (tail === "left") {
         px = [seq(popMean - 10 * SE, sampMean, 300)];
         p = sampMean > popMean ? 1 - pValue : pValue;
      } else if (tail === "right") {
         px = [seq(sampMean, popMean + 10 * SE, 300)];
         p = sampMean > popMean ? pValue : 1 - pValue;
      } else {
         const dm = Math.abs(sampMean - popMean)
         px = [seq(popMean - 6 * SE, popMean - dm, 150), seq(popMean + dm, popMean + 6 * SE, 150)];
         p = 2 * pValue;
      }

      // compute density values for the area points
      pf = px.map(x => dt(x.map(m => (m - popMean) / SE), sampSize - 1));
   }

   // cumulative statistics
   $: {

      // reset statistics if sample size, population proportion or a test tail has been changed
      if (oldSampSize !== sample.length || oldPopMean !== popMean || oldPopSD !== popSD || oldTail !== tail) {
         oldSampSize = sample.length;
         oldPopMean = popMean;
         oldPopSD = popSD;
         oldTail = tail;
         nSamples = 0;
         nSamplesBelow005 = 0;
      }

      // count number of samples taken for the same test conditions and how many have p-value < 0.05
      nSamples = nSamples + 1;
      nSamplesBelow005 = nSamplesBelow005 + (p < 0.05);
   }

   $: H0LegendStr = `H0: µ ${signs[tail]} ${popMean.toFixed(1)}`;
   $: percentBelow005Str = `# samples with p < 0.05 = ${nSamplesBelow005}/${nSamples} (${(100 * nSamplesBelow005/nSamples).toFixed(1)}%)`;

</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={[90, 110]} limY={[-0.005, max(f) * 1.70]} xLabel={"Expected sample mean, m"}>

   <!-- statistics -->
   <TextLegend textSize={1.25} x={90} y={max(f) * 1.55} pos={2} dx="2em" elements = {[
         percentBelow005Str,
         H0LegendStr,
         "p-value: " + p.toFixed(3),
         "sample mean: " + sampMean.toFixed(2),
         "sample sd: " + sampSD.toFixed(2)
   ]} />

   <!-- area for p-value -->
   {#each px as x, i}
   <AreaSeries xValues={x} yValues={pf[i]} lineColor={colors[0] + "40"} fillColor={colors[0] + "40"}/>
   {/each}

   <!-- PDF for sampling distribution -->
   <LineSeries xValues={x} yValues={f} lineColor={colors[0] + "40"} />
   <Segments xStart={[sampMean]} xEnd={[sampMean]} yStart={[0]} yEnd={[max(f)]} lineColor={colors[1]} />

   <XAxis slot="xaxis" ></XAxis>
</Axes>

