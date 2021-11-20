<script>
   import {pt, round, seq, sd, max, dt, mean} from 'stat-js';
   import {Axes, XAxis, LineSeries, AreaSeries, TextLegend, Segments} from 'svelte-plots-basic';

   export let popMean;
   export let popH0Mean;
   export let popSD;
   export let sample;
   export let colors;
   export let tail;

   // sign symbols for hypothesis tails
   const signs = {"both": "=", "left": "≥", "right": "≤"};
   const tCrit = {
      "both": {"5": 2.776445, "10": 2.262157, "20": 2.093024, "40": 2.022691},
      "left": {"5": 2.131847, "10": 1.833113, "20": 1.729133, "40": 1.684875},
      "right": {"5": 2.131847, "10": 1.833113, "20": 1.729133, "40": 1.684875}
   }

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
   $: tValue = (sampMean - popH0Mean) / SE;


   // PDF curve for sampling distribution (H0)
   $: x = seq(popH0Mean - 10 * SE, popH0Mean + 10 * SE, 300);
   $: f = dt(x.map(v => (v - popH0Mean) /SE), sampSize - 1);

   // PDF curve for sampling distribution (real)
   $: xr = seq(popMean - 10 * popSE, popMean + 10 * popSE, 300);
   $: fr = dt(xr.map(v => (v - popMean) / popSE), sampSize - 1);

   // Area for power of test
   $: critMean = tail === "right" ? popH0Mean + tCrit[tail][sampSize] * popSE : popH0Mean - tCrit[tail][sampSize] * popSE;
   $: power = tail === "right" ? 1 - pt((critMean - popMean) / popSE, sampSize - 1) : pt((critMean - popMean) / popSE, sampSize - 1);

   // PDF curve for p-value
   $: px = tail === "right" ? seq(sampMean, popMean + 10 * SE, 100) : seq(popMean - 10 * SE, sampMean, 100);
   $: pf = dt(px.map(m => (m - popH0Mean) / SE), sampSize - 1);

   // The p-value
   $: p = tail === "right" ? 1 - pt(tValue, sampSize - 1) : pt(tValue, sampSize - 1);

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
   <TextLegend textSize={1.15} x={85} y={max(f) * 1.55} pos={2} dx="1.30em" elements = {[
         percentBelow005Str,
         "sample mean: " + sampMean.toFixed(2),
         "sample sd: " + sampSD.toFixed(2),
         "p-value: " + p.toFixed(3),
         H0LegendStr,
         "<tspan font-weight=bold>power: " + power.toFixed(3) + "</tspan>"
   ]} />

   <!-- Area for p-value -->
   <AreaSeries xValues={px} yValues={pf} lineColor={colors[0] + "40"} fillColor={colors[0] + "40"}/>

   <!-- PDF for sampling distribution -->
   <LineSeries xValues={x} yValues={f} lineColor={colors[0] + "f0"} />
   <LineSeries xValues={xr} yValues={fr} lineColor={colors[1] + "f0"} />
   <Segments xStart={[sampMean]} xEnd={[sampMean]} yStart={[0]} yEnd={[max(f)]} lineType={3} lineColor={colors[1] + "a0"} />

   <XAxis slot="xaxis" ></XAxis>
</Axes>

