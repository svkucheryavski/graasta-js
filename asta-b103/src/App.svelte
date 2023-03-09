<script>
   import { Vector } from 'mdatools/arrays';
   import { dnorm, dunif, pnorm, punif } from 'mdatools/distributions';
   import { closestind } from 'mdatools/misc';

   // shared components
   import { default as StatApp } from '../../shared/StatApp.svelte';
   import { colors } from '../../shared/graasta';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';
   import AppControlRange from '../../shared/controls/AppControlRange.svelte';
   import AppControl from '../../shared/controls/AppControl.svelte';

   // local components
   import PDFPlot from './PDFPlot.svelte';
   import CDFPlot from './CDFPlot.svelte';
   import ICDFPlot from './ICDFPlot.svelte';

   // constant parameters
   const size = 14001;
   const limX = [100, 230];
   const xTicks = [100, 120, 140, 160, 180, 200, 220];
   const lineColor = colors.plots.POPULATIONS[0];
   const selectedLineColor = colors.plots.SAMPLES[0];
   const x = Vector.seq(limX[0], limX[1], (limX[1] - limX[0]) / size);
   const varName = 'Height, cm';

   // mode and indices of x and p values for interval
   let mode = 'Value';
   let intInd = [0, Math.round(size/2) + 1];

   // parameters and settings for distributions
   let distrs = {
      'Normal': {
         params: [170, 10],
         paramLabels: ['Mean', 'Std'],
         paramLimits: [[160, 180], [5, 15]],
         pdf: dnorm,
         cdf: pnorm,
         limY: [-0.001, 0.06]
      },
      'Uniform': {
         params: [135, 205],
         paramLabels: ['Min', 'Max'],
         paramLimits: [[120, 150], [180, 220]],
         pdf: dunif,
         cdf: punif,
         limY: [-0.001, 0.04]
      }
   }

   // initial x- and p-values for the interval
   let x1 = 100;
   let x2 = 170;
   let p1 = 0.0;
   let p2 = 0.5;

   // initial name of distribution
   let selectedName = 'Normal';


   /**
    * Handler of event when left interval boundary is changed.
    *
    * @param x - vector with x-values.
    * @param a - the new value for left boundary.
    * @param mode - app mode ('Values' or 'Interval').
    *
    */
   function changeValue1(x, a, mode) {

      if (mode === 'Value') {
         intInd = [0, intInd[1]];
         x1 = x.v[0];
         p1 = p.v[0];
      } else {
         a = a > x2 ? x2 : a;
         x1 = a;
         intInd = [closestind(x, a), intInd[1]];
         p1 = p.v[intInd[0]];
      }
   }


   /**
    * Handler of event when right interval boundary is changed.
    *
    * @param x - vector with x-values.
    * @param b - the new value for right boundary.
    * @param mode - app mode ('Values' or 'Interval').
    *
    */
   function changeValue2(x, b, mode) {

      if (mode === 'Value') {
         intInd = [0, intInd[1]];
         x1 = x.v[0];
         p1 = p.v[0];
      } else {
         b = b < x1 ? x1 : b;
         x2 = b;
      }

      intInd = [intInd[0], closestind(x, b)];
      p2 = p.v[intInd[1]];
   }

   /**
    * Handler of event when probability value for left interval boundary is changed.
    *
    * @param p - vector with probability values.
    * @param pa - the new value for left boundary probability.
    * @param mode - app mode ('Values' or 'Interval').
    *
    */
   function changeProb1(p, pa, mode) {

      if (mode === 'Value') {
         intInd = [0, intInd[1]];
         x1 = x.v[0];
         p1 = p.v[0];
      } else {
         pa = pa > p2 ? p2 : pa;
         p1 = pa;
         intInd = [closestind(p, pa), intInd[1]];
         x1 = x.v[intInd[0]];
      }
   }

   /**
    * Handler of event when probability value for right interval boundary is changed.
    *
    * @param p - vector with probability values.
    * @param pb - the new value for right boundary probability.
    * @param mode - app mode ('Values' or 'Interval').
    *
    */
   function changeProb2(p, pb, mode) {

      if (mode === 'Value') {
         intInd = [0, intInd[1]];
         x1 = x.v[0];
         p1 = p.v[0];
      } else {
         pb = pb < p1 ? p1 : pb;
         p2 = pb;
      }

      intInd = [intInd[0], closestind(p, pb)];
      x2 = x.v[intInd[1]];
   }


   // reactive expressions

   $: distr = distrs[selectedName];
   $: d = distr.pdf(x, distr.params[0], distr.params[1]);
   $: p = distr.cdf(x, distr.params[0], distr.params[1]);

   $: changeValue1(x, x1, mode);
   $: changeValue2(x, x2, mode);
   $: changeProb1(p, p1, mode);
   $: changeProb2(p, p2, mode);
</script>

<StatApp>
   <div class="app-layout">
      <div class="app-layout-column pdf-area">
         <PDFPlot x={x} y={d} {xTicks} {varName} {intInd} p={p.v[intInd[1]] - p.v[intInd[0]]} {lineColor} {selectedLineColor} limX={limX} limY={distr.limY} />
         <div class="app-control-area">
            <AppControlArea>
               <AppControlSwitch
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
         <CDFPlot x={x} y={p} {xTicks} {varName} {mode} {intInd} limX={limX} {lineColor} {selectedLineColor} limY={[-0.05, 1.1]} />
         <div class="app-control-area">
            <AppControlArea>
               {#if mode === "Interval"}
               <AppControlRange id="a" label="x<sub>1</sub>" step={0.5} min={limX[0]} max={limX[1]} bind:value={x1} />
               {:else}
               <AppControl id="empty" label="&nbsp;"></AppControl>
               {/if}
               <AppControlRange id="b" label="x<sub>2</sub>" step={0.5} min={limX[0]} max={limX[1]} bind:value={x2} />
               <AppControlSwitch
                  id="mode"
                  label="Mode"
                  options={["Value", "Interval"]}
                  bind:value={mode}
               />
            </AppControlArea>
         </div>
      </div>
      <div class="app-layout-column icdf-area">
         <ICDFPlot x={x} y={p} {varName} {mode} {intInd} limX={limX} {lineColor} {selectedLineColor} limY={[-0.05, 1.05]} />
         <div class="app-control-area">
            <AppControlArea>
               {#if mode === "Interval"}
               <AppControlRange id="pa" label="p<sub>1</sub>" step={0.005} min={0} max={1} bind:value={p1} decNum={3} />
               {:else}
               <AppControl id="empty" label="&nbsp;"></AppControl>
               {/if}
               <AppControlRange id="pb" label="p<sub>2</sub>" step={0.005} min={0} max={1} bind:value={p2} decNum={3} />
               <AppControlSwitch
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
         This app lets you play with three main functions available for any theoretical distribution: <em>Probability Density Function</em> (PDF), <em>Cumulative Distribution Function</em> (CDF) and <em>Inverse Cumulative Distribution Function</em> (ICDF). The functions can be used for different purposes. Thus PDF shows a shape of distribution in form of a density of the values, the higher density — the bigger chance that your random value will be there. For example, in case of normal distribution, the highest density is around <em>mean</em>, so mean is the most expected value in this case.
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