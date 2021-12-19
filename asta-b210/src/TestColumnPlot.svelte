<script>
   import {rep, mean} from 'mdatools/stat';
   import {Axes, YAxis, TextLegend, ScatterSeries} from "svelte-plots-basic";

   // shared components
   import {formatLabels} from "../../shared/graasta";

   // shared components - plots
   import BoxAndWhiskers from "../../shared/plots/BoxAndWhiskers.svelte";

   export let popMeans;
   export let popSigma;
   export let samples;
   export let color;
   export let boxColor;
   export let pValues = [];
   export let alpha;

   let oldAlpha;
   let oldPopSigma;
   let nSamplesBelow005 = 0;
   let nSamples = 0;

   $: {
      // reset statistics if sample size, population proportion or a test tail has been changed
      if (oldPopSigma !== popSigma || oldAlpha !== alpha) {
         oldPopSigma = popSigma;
         oldAlpha = alpha;
         nSamples = 0;
         nSamplesBelow005 = 0;
      }

      // count number of samples taken for the same test conditions and how many have p-value < 0.05
      if (pValues.length > 0) {
         nSamples = nSamples + 1;
         nSamplesBelow005 = nSamplesBelow005 + (pValues.filter(p => p < alpha).length > 0);
      }
   }

   $: popQuartiles = popMeans.map(v => [v - popSigma, v, v + popSigma]);
   $: popRanges = popQuartiles.map(v => [v[0] - 1.5 * (v[2] - v[0]), v[2] + 1.5 * (v[2] - v[0])]);

   $: legendElements = formatLabels([
      {name: "H0", value: "µA = µB = µC"},
      {name: "H0 rejections", value: `${nSamplesBelow005}/${nSamples} (${(100 * nSamplesBelow005/nSamples).toFixed(1)})`},
      {name: "alpha for each test", value: alpha.toFixed(3)}
   ]);
</script>

<Axes limX={[-0.5, 2.5]} limY={[50, 180]}>
   <!-- statistics -->
   <TextLegend textSize={1.05} left={-0.5} top={170} dx="1.5em" dy="1.4em" elements={legendElements} />

   {#each popQuartiles as p, i}

      <BoxAndWhiskers
         lineWidth={2}
         faceColor={boxColor}
         borderColor={boxColor}
         range={popRanges[i]}
         quartiles={popQuartiles[i]}
         boxPosition={i}
         boxSize={0.5}
         horizontal={false}
      />

      <ScatterSeries
         borderWidth={2}
         faceColor="transparent"
         borderColor={color}
         markerSize={1.25}
         xValues={rep(i, samples[i].length)}
         yValues={samples[i]}
      />

      <ScatterSeries
         borderWidth={2}
         faceColor="transparent"
         borderColor={"green"}
         marker={8}
         markerSize={1.25}
         xValues={[i]}
         yValues={[mean(samples[i])]}
      />

   {/each}
   <YAxis slot="yaxis" />
</Axes>

