<script>
   import {seq, dnorm, dunif, pnorm, punif} from 'stat-js';
   import AppControlArea from '../../shared/AppControlArea.svelte';
   import AppControlSelect from '../../shared/AppControlSelect.svelte';
   import AppControlRange from '../../shared/AppControlRange.svelte';
   import AppControl from '../../shared/AppControl.svelte';

   // common blocks
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // local apps
   import PDFPlot from './PDFPlot.svelte';
   import CDFPlot from './CDFPlot.svelte';
   import ICDFPlot from './ICDFPlot.svelte';


   const size = 1301;
   const limX = [100, 230];
   const varName = "Height, cm";
   let mode = "Value";

   let distrs = {
      "Normal": {
         params: [170, 10],
         paramLabels: ["Mean", "Std"],
         paramLimits: [[160, 180], [5,15]],
         pdf: dnorm,
         cdf: pnorm,
         limY: [-0.001, 0.06]
      },
      "Uniform": {
         params: [135, 205],
         paramLabels: ["Min", "Max"],
         paramLimits: [[120, 150], [180,220]],
         pdf: dunif,
         cdf: punif,
         limY: [-0.001, 0.04]
      }
   }

   let intInd = [0, Math.round(size/2) + 1];

   const closestIndex = (x, a) => {
      const c =  x.reduce((prev, curr) => Math.abs(curr - a) < Math.abs(prev - a) ? curr : prev);
      return x.indexOf(c);
   }

   const changeValues = (x, a, b, mode) => {

      if (mode === "Value") {
         intInd = [0, closestIndex(x, b)];
         x1 = x[0];
      } else {
         a = (a > b) ? b : a;
         x1 = a;
         intInd = [closestIndex(x, a), closestIndex(x, b)];
      }

      p1 = p[intInd[0]];
      p2 = p[intInd[1]];
   }

   const changeProbabilities = (p, pa, pb, mode) => {

      if (mode === "Value") {
         intInd = [0, closestIndex(p, pb)];
         p1 = p[0];
      } else {
         pa = (pa > pb) ? pb : pa;
         p1 = pa;
         intInd = [closestIndex(p, pa), closestIndex(p, pb)];
      }

      x1 = x[intInd[0]];
      x2 = x[intInd[1]];
   }

   let x1 = 100;
   let x2 = 170;
   let p1 = 0;
   let p2 = 0.5;

   let selectedName = "Normal";

   $: distr = distrs[selectedName];
   $: x = seq(limX[0], limX[1], size);
   $: d = distr.pdf(x, distr.params[0], distr.params[1]);
   $: p = distr.cdf(x, distr.params[0], distr.params[1]);
   $: changeValues(x, x1, x2, mode);
   $: changeProbabilities(p, p1, p2, mode);
</script>

<StatApp>
   <div class="app-layout">
      <div class="app-layout-column pdf-area">
         <PDFPlot x={x} y={d} {varName} {intInd} p={p[intInd[1]] - p[intInd[0]]} limX={limX} limY={distr.limY} />
         <div class="app-control-area">
            <AppControlArea>
               <AppControlSelect
                  id="distributionName"
                  label="Distribution"
                  options={Object.keys(distrs)}
                  bind:value={selectedName}
               />
               <AppControlRange
                  id="param1"
                  label={distr.paramLabels[0]}
                  min={distr.paramLimits[0][0]}
                  max={distr.paramLimits[0][1]}
                  bind:value={distr.params[0]}
               />
               <AppControlRange
                  id="param2"
                  label={distr.paramLabels[1]}
                  min={distr.paramLimits[1][0]}
                  max={distr.paramLimits[1][1]}
                  bind:value={distr.params[1]}
               />
            </AppControlArea>
         </div>
      </div>
      <div class="app-layout-column cdf-area">
         <CDFPlot x={x} y={p} {varName} {mode} {intInd} limX={limX} limY={[-0.01, 1.1]} />
         <div class="app-control-area">
            <AppControlArea>
               {#if mode === "Interval"}
               <AppControlRange id="a" label="x<sub>1</sub>" step={0.1} min={limX[0]} max={limX[1]} bind:value={x1} />
               {:else}
               <AppControl id="empty" label="&nbsp;"></AppControl>
               {/if}
               <AppControlRange id="b" label="x<sub>2</sub>" step={0.1} min={limX[0]} max={limX[1]} bind:value={x2} />
               <AppControlSelect
                  id="mode"
                  label="Mode"
                  options={["Value", "Interval"]}
                  bind:value={mode}
               />
            </AppControlArea>
         </div>
      </div>
      <div class="app-layout-column icdf-area">
         <ICDFPlot x={x} y={p} {varName} {mode} {intInd} limX={limX} limY={[-0.01, 1.1]} />
         <div class="app-control-area">
            <AppControlArea>
               {#if mode === "Interval"}
               <AppControlRange id="pa" label="p<sub>1</sub>" step={0.001} min={0} max={1} bind:value={p1} decNum={3} />
               {:else}
               <AppControl id="empty" label="&nbsp;"></AppControl>
               {/if}
               <AppControlRange id="pb" label="p<sub>2</sub>" step={0.001} min={0} max={1} bind:value={p2} decNum={3} />
               <AppControlSelect
                  id="mode"
                  label="Mode"
                  options={["Value", "Interval"]}
                  bind:value={mode}
               />
            </AppControlArea>
         </div>
      </div>
   </div>

   <div slot="help">
      <h2>PDF, CDF, and ICDF</h2>

      <p>
         This app lets you play with three main functions available for any theoretical distribution: <em>Probability Density Function</em> (PDF), <em>Cumulative Distribution Function</em> (CDF) and <em>Inverse Cumulative Distribution Function</em> (ICDF).
         The functions can be used for different purposes. Thus PDF shows a shape of distribution in form of a density of the values, the higher density — the bigger chance that your random value will be there. For example, in case of normal distribution, the higest density is around <em>mean</em>, so mean is the most expected value in this case.
      </p>

      <p>
         CDF function gives you a chance to get a value smaller than given. While the ICDF does the opposite — gives you a value for a given probability. The functions in this app can be used in "Value" mode, for a single value, as well as in "Interval" mode for an interval limited by two values.
         </p>
         <p>
         For example, we are talking about height of people, normally distributed with mean = 170 cm and std = 10 cm (initial settings of the app). What is a chance that a random person from this population will have height between 160 and 180 cm? Or, in other words, how many people in percent have height between these two values in the population? Just set <em>x</em><sub>1</sub> to 160 and <em>x</em><sub>2</sub> to 180 under the CDF plot and you will see the result (in this case the chance is around 0.683 or 68.3%).
      </p>
   </div>
</StatApp>

<style>

.app-layout {
   width: 100%;
   height: 100%;
   position: relative;
   display: flex;
}

.app-layout-column {
   flex: 1 1 33%;
   display: flex;
   flex-direction: column;
}


.pdf-area, .cdf-area {
   padding-right: 10px;
}

.app-control-area {
   padding-top: 30px;
}
</style>