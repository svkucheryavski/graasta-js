<script>
   import { Index, Vector } from 'mdatools/arrays';
   import { polyfit, polypredict } from 'mdatools/models';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // local components
   import AppCoeffsPlot from './AppCoeffsPlot.svelte';
   import AppPlot from './AppPlot.svelte';

   // delay for CV runs in ms
   const CVDELAY = 500;

   // initial values for managable parameters
   let pName = 'line';

   // constant parameters
   const pDegrees = {'line': 1, 'quadratic': 2, 'cubic': 3};
   const sampSize = 12;
   const popSize = 500;
   const meanX = 0;
   const sdX = 1;
   const noise = 0.5;

   // create a population
   const popZ = Vector.randn(popSize);
   const popX = Vector.randn(popSize, meanX, sdX).sort();
   const popY = popX.apply((x, i) => -2 + 2.5 * x).add(popZ.mult(noise));
   const popInd = Index.seq(1, popSize);

   // timer for delay
   const timer = ms => new Promise(res => setTimeout(res, ms))

   // runtime parameters
   let reset = false;
   let ready = false;

   let indSeg = -1;
   let yCV = Vector.fill(NaN, sampSize);
   let localModel = undefined;

   // sample parameters
   let sampInd = [];
   let sampX = [];
   let sampY = [];

   // function to take a new sample
   function takeNewSample() {
      resetAll();
      sampInd = popInd.shuffle().slice(1, sampSize);
      sampX = popX.subset(sampInd);
      sampY = popY.subset(sampInd);
   }

   // function to reset previous CV results
   function resetAll() {
      reset = true;
      ready = false;
      localModel = undefined;
      yCV = Vector.fill(NaN, sampSize)
      indSeg = -1;
   }

   // function for running cross-validation iterations with delay
   async function run() {

      // reset all CV results
      resetAll();

      // the cross-validation loop
      const ind = Index.seq(1, sampSize);
      reset = false;
      for (indSeg = 0; indSeg < sampSize; indSeg++) {
         const calInd = ind.filter(v => v !== indSeg + 1)
         localModel = polyfit(sampX.subset(calInd), sampY.subset(calInd), pDegree);
         yCV.v[indSeg] = polypredict(localModel, sampX.subset(indSeg + 1));

         await timer(CVDELAY);
      }

      // set indSeg to -1 to remove last segment from plot and compute overall performance
      indSeg = -1;
      ready = true;
   }

   // function for selection of new polynomial degree
   function getPDegree(name) {
      resetAll();
      return pDegrees[name];
   }

   // change polynomial degree
   $: pDegree = getPDegree(pName);

   // create global model for given polynomial degree
   $: globalModel = polyfit(sampX, sampY, pDegree);

   // create population model for given polynomial degree
   $: popModel = polyfit(popX, popY, pDegree);

   // take initial sample
   takeNewSample()
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-plot-area">
         <!-- scatter plot -->
         <AppPlot {indSeg} {localModel} {globalModel} {popModel} />
      </div>

      <div class="app-table-area">
         <!-- table -->
         <AppCoeffsPlot {localModel} {globalModel} {popModel} {reset} {ready} />
      </div>

      <div class="app-controls-area">
         <!-- Control elements -->
         <AppControlArea>
            <AppControlSwitch
               disable={indSeg > -1}
               id="pDegree" label="Polynomial"
               bind:value={pName} options={Object.keys(pDegrees)}
            />
            <AppControlButton
               disable={indSeg > -1}
               on:click={() => takeNewSample()}
               id="runCV" label="Sample" text="Take new"
            />
            <AppControlButton
               disable={indSeg > -1}
               on:click={() => run()}
               id="runCV" label="CV" text="Run"
            />
         </AppControlArea>
      </div>
   </div>

   <div slot="help">
      <h2>Jackknife resampling for regression coefficients</h2>
      <p>
         Jackknife resampling is a way to make an inference (e.g. compute confidence intervals of find a p-value for H0: β = 0) for regression coefficients based on full cross-validation. The idea is to estimate a variance of regression coefficients computed for each local model (every time we take one sample out, we compute a new model, which is called <em>local</em>) and then compute
         the standard error for the coefficient based on this variance.
      </p>
      <p>
         In this app population consists of 500 measurements of <em>x</em> and <em>y</em>, where <em>y</em> linearly depends on <em>x</em>. However, if you take a small sample (in this app the sample size is fixed to <em>n</em> = 12), it can have a random non-linear effect in the <em>y</em>(<em>x</em>) relationship, so when this sample is fitted by a polynomial model, the regression coefficients for quadratic or cubic terms will not be zero. But if you use Jackknife, then most of the time it will be able to detect that the estimated coefficients are in fact not significant, so statistically they are not distinguishable from zero.
      </p>
      <p>
         In order to investigate this, set polynomial to <em>cubic</em> and take a sample where the last two regression coefficients will be
         relatively large, so you can see them as small blue bars on the coefficients' plot. Then run the cross-validation procedure and see how all coefficients vary for the local models. At the end you will see errorbars which correspond to 95% confidence intervals and for the non-linear terms, most of the time, the interval will cross zero.
      </p>
   </div>
</StatApp>

<style>

.app-layout {
   width: 100%;
   height: 100%;
   position: relative;

   display: grid;
   grid-template-areas:
      "plot table"
      "plot controls";

   grid-template-rows: 1fr auto;
   grid-template-columns: minmax(60%, 80%) minmax(300px, 500px);
}

.app-plot-area {
   grid-area: plot;
}

.app-table-area {
   grid-area: table;
}

.app-controls-area {
   padding-left: 1em;
   grid-area: controls;
}

</style>