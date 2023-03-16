<script>
   import { max, min, sd } from 'mdatools/stat';
   import { Vector, vector, cbind, crossprod, tcrossprod } from 'mdatools/arrays';

   import { Points } from 'svelte-plots-basic/3d';

   // shared components
   import {default as StatApp} from "../../shared/StatApp.svelte";
   import { colors } from '../../shared/graasta';

   // shared components - plots
   import AppPlot from '../../shared/plots/3DPlotAxes.svelte';
   import ModelPlot from '../../shared/plots/MLRModelPlot.svelte';

   // shared components - controls
   import AppControlArea from "../../shared/controls/AppControlArea.svelte";
   import AppControlSelect from '../../shared/controls/AppControlSelect.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';

   // local components
   import PointLineEquation from './PointLineEquation.svelte';
   import AppCoeffsPlot from './AppCoeffsPlot.svelte';



   // constant parameters
   const popCoeffs = vector([10, 1, 1]);
   const modelColor = '#a0a0ef70';
   const pointColor = colors.plots.SAMPLES[0];
   const corrOptions = {'no': 0.0, 'low': 0.3, 'med': 0.7, 'high':0.95};
   const sampSizeOptions = {'10': 10, '15': 15, '30': 30};
   const yerrOptions = {'low': 0.1, 'med': 0.25, 'large': 0.5};

   let corrStr = 'low';
   let sampSizeStr = '30';
   let yerrStr = 'low';

   // axes limits (a bit wider the X range)
   const limX = [-3, 3];
   const limY = [0, 15];
   const limZ = [-3, 3];


   // function for taking a new sample
   function takeSample() {
      x1 = Vector.rand(sampSize, -2, 2);
   }

   // function fo rescaling x values
   function rescale(x, r1, r2) {
      const mx = max(x);
      const mn = min(x);
      const d1 = mx - mn;
      const d2 = r2 - r1;

      return x.apply(v => r1 + (v - mn) / d1 * d2);
   }

   // reactive parameters depend on user input
   $: corr = corrOptions[corrStr];
   $: sampSize = sampSizeOptions[sampSizeStr];
   $: yErr = yerrOptions[yerrStr];

   // create data values
   let x1, x2, X, y, sampCoeffs;
   $: {
      // generate x1 values as random numbers
      x1 = Vector.rand(sampSize, -2, 2);

      // compute x2 values based on x1 and the correlation degree
      x2 = rescale(x1.mult(corr / sd(x1)).add(Vector.randn(sampSize, 2, 2 - 2 * Math.abs(corr))), -2, 2);

      // combine x-variables together and add column of ones.
      X = cbind(Vector.ones(sampSize), x1, x2);

      // compute theoretical y-values and add some noise
      y = X.dot(popCoeffs).add(Vector.randn(sampSize, 0, yErr)).getcolumn(1);

      // fit MLR model to the sample
      sampCoeffs = tcrossprod(crossprod(X).inv(), X).dot(y).getcolumn(1);
   }
</script>

<StatApp>
   <div class="app-layout">

      <!-- Line equations -->
      <div class="app-eq-area">
         <PointLineEquation {sampCoeffs} {popCoeffs} />
      </div>

      <!-- 3D plot -->
      <div class="app-plot-area">
         <AppPlot {limX} {limY} {limZ}>
            <Points xValues={x1} zValues={x2} yValues={y} borderWidth={2} borderColor={pointColor} />
            <Points xValues={x1} zValues={x2} yValues={Vector.zeros(sampSize)} borderWidth={2} borderColor={"#b0b0b0"}/>
            <ModelPlot color={modelColor} coeffs={Vector.c(sampCoeffs, 0)} X1Range={[-3, 3]} X2Range={[-3, 3]} />
         </AppPlot>
      </div>

      <!-- Coefficients plot -->
      <div class="app-coeffs-plot">
         <AppCoeffsPlot {popCoeffs} {sampCoeffs} {corr} {sampSize} {yErr}/>
      </div>

      <!-- Controls -->
      <div class="app-controls-area">
         <AppControlArea>
            <AppControlSelect id="corr" label="cor(x1,x2)" bind:value={corrStr} options={Object.keys(corrOptions)} />
            <AppControlSelect id="yerr" label="Fitting error" bind:value={yerrStr} options={Object.keys(yerrOptions)} />
            <AppControlSelect id="sampSize" label="Sample size" bind:value={sampSizeStr} options={Object.keys(sampSizeOptions)} />
            <AppControlButton id="newsample" label="Sample" text="Take new" on:click={takeSample} />
         </AppControlArea>
      </div>
   </div>

   <div slot="help">
      <h2>Colinearity in MLR</h2>
      <p>This app demosampSizeStrates how co-linearity can affect an MLR model. <em>Colinearity</em> is a situation when two or several predictors (<em>x</em>-variables) are correlated (have linear relationship). This can cause some problems when fitting an MLR model, as it implies the lack of correlation among the predictors. If correlation is above moderate, this leads to larger uncertainty between the estimated and expected regression coefficients. But If correlation is high/strong, this can lead to a very large uncertainty and makes the model uninterpretable. In some cases it can even make the fitting impossible.
      </p>
      <p>
      The severity of the problem depends on several things. First of all, on how strong the correlation among the predictors is. Usually MLR is stable to weak or moderate correlations. Second factor is the sample size, the smaller number of observations the bigger the uncertainty is. And, finally, it also depends on the fitting error — how well y-values are fitted by the model. In this app you can change all these parameters and then take several samples and see how big will be the uncertainty and how far is the MLR plane from the expected. Start with default settings which gives the best model, take several samples and check how far the regression coefficients of the fitted model are from the expected/theoretical shown with gray bars. Then play with the sample quality parameters and check how do they influence the fitting quality.
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
      "eq   coeffsplot"
      "plot coeffsplot"
      "plot controls";
   grid-template-rows: min-content 1fr 1fr;
   grid-template-columns: minmax(60%, 80%) minmax(300px, 500px);
}

.app-eq-area {
   box-sizing: border-box;
   grid-area: eq;
}

.app-plot-area {
   box-sizing: border-box;
   grid-area: plot;
}

.app-coeffs-plot {
   box-sizing: border-box;
   grid-area: coeffsplot;
}

.app-controls-area {
   box-sizing: border-box;
   padding-left: 1em;
   grid-area: controls;
}

.app-controls-area > :global(*){
   margin: 1em 0;
}

</style>