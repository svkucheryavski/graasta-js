<script>
   import {cumsum, round, seq, sd, max, dt, mean, closestIndex} from 'stat-js';
   import {Axes, XAxis, LineSeries, AreaSeries, TextLegend, Segments} from 'svelte-plots-basic';

   export let popMean;
   export let popH0Mean;
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
   $: popSE = popSD / Math.sqrt(sampSize);
   $: tValue = -Math.abs((sampMean - popH0Mean) / SE);

   // PDF curve for sampling distribution (H0)
   $: x = seq(popH0Mean - 10 * SE, popH0Mean + 10 * SE, 300);
   $: f = dt(x.map(v => (v - popH0Mean) /SE), sampSize - 1);

   // PDF curve for sampling distribution (real)
   $: xr = seq(popMean - 10 * popSE, popMean + 10 * popSE, 300);
   $: fr = dt(xr.map(v => (v - popMean) / popSE), sampSize - 1);

   // here we approximate CDF for t-distribution
   const t1 = seq(-30, -5, 20000);
   const t2 = seq(-5, 0, 20000);
   $: p1 = cumsum(dt(t1, sampSize - 1)).map(v => v * (t1[1] - t1[0]));
   $: p2 = cumsum(dt(t2, sampSize - 1)).map(v => v * (t2[1] - t2[0]));

   // this p-value is always for left half of the PDF and has to be adjusted
   $: pValue = tValue < -5 ? p1[closestIndex(t1, tValue)] : p2[closestIndex(t2, tValue)] + p1[19999];

   // Correct p-value and p-value area
   let px, pf, p;

   // Function which computes x-values for the area under PDF which corresponds to the p-value
   function getPX(tail, popMean, sampMean, SE, tCrit = 10, n = 300) {
      const tValue = (sampMean - popH0Mean) / SE

      if (tail === "left") {
         return tValue < -tCrit ? [] : [seq(popMean - tCrit * SE, sampMean, n)];
      }

      if (tail === "right") {
         return tValue > tCrit ? [] : [seq(sampMean, popMean + tCrit * SE, n)];
      }

      const dm = Math.abs(sampMean - popMean)
      return Math.abs(tValue) > tCrit ? [] : [seq(popMean - tCrit * SE, popMean - dm, n/2), seq(popMean + dm, popMean + tCrit * SE, n/2)];
   }

   $: {
      // compute p-value
      if (tail === "left") {
         p = sampMean > popH0Mean ? 1 - pValue : pValue;
      } else if (tail === "right") {
         p = sampMean > popH0Mean ? pValue : 1 - pValue;
      } else {
         p = 2 * pValue;
      }

      // compute coordinates of corresponding area on the plot
      px = getPX(tail, popH0Mean, sampMean, SE);
      pf = px.length < 1 ? [] : px.map(x => dt(x.map(m => (m - popH0Mean) / SE), sampSize - 1));
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

   $: H0LegendStr = `H0: µ ${signs[tail]} ${popH0Mean.toFixed(1)}`;
   $: percentBelow005Str = `# samples with p < 0.05 = ${nSamplesBelow005}/${nSamples} (${(100 * nSamplesBelow005/nSamples).toFixed(1)}%)`;
</script>

<!-- plot with population based CI and position of current sample proportion -->
<Axes limX={[85, 115]} limY={[-0.005, max(f) * 1.70]} xLabel={"Expected sample mean, m"}>

   <!-- statistics -->
   <TextLegend textSize={1.15} x={85} y={max(f) * 1.55} pos={2} dx="1.2em" elements = {[
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
   <LineSeries xValues={x} yValues={f} lineColor={colors[0] + "50"} />
   <LineSeries xValues={xr} yValues={fr} lineColor={colors[1] + "50"} />
   <Segments xStart={[sampMean]} xEnd={[sampMean]} yStart={[0]} yEnd={[max(f)]} lineColor={colors[1]} />

   <XAxis slot="xaxis" ></XAxis>
</Axes>

