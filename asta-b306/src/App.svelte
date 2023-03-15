<script>
   import { Index, Vector } from 'mdatools/arrays';
   import { max, mean, ssq } from 'mdatools/stat';
   import { polyfit, polypredict } from 'mdatools/models';

   // shared components
   import {default as StatApp} from '../../shared/StatApp.svelte';

   // shared components - controls
   import AppControlArea from '../../shared/controls/AppControlArea.svelte';
   import AppControlButton from '../../shared/controls/AppControlButton.svelte';
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // local components
   import AppTable from './AppTable.svelte';
   import AppPlot from './AppPlot.svelte';

   // delay for CV runs in ms
   const CVDELAY = 1000;

   // initial values for managable parameters
   let cvType = 'random';
   let pName = 'line';

   // constant parameters
   const pDegrees = {'line': 1, 'quadratic': 2, 'cubic': 3};
   const nSegments = 4;
   const sampSize = 12;
   const meanX = 0;
   const sdX = 1;
   const noise = 0.5;

   // create a sample
   const sampZ = Vector.randn(sampSize);
   const sampX = Vector.randn(sampSize, meanX, sdX).sort();
   const sampY = sampX.apply((x, i) => -2 + 2.5 * x).add(sampZ.mult(noise));

   // timer for delay
   const timer = ms => new Promise(res => setTimeout(res, ms))

   // runtime parameters
   let indSeg = -1;
   let yCV = Vector.fill(NaN, sampSize);
   let statCV = undefined;
   let localModel = undefined;

   // function for compoting R2 and se for a model
   function getStat(y, yp, p) {
      const SSE = ssq(y.subtract(yp));
      const SSY = ssq(y.subtract(mean(y)));
      const DoF = y.length - (pDegree + 1);
      return {R2: 1 - SSE/SSY, se: Math.sqrt(SSE/DoF)}
   }

   function cv2obs(cv, k) {
      const ind = Index.seq(1, cv.length);
      return [
         new Index(ind.v.filter(v => cv.v[v - 1] != k)),
         new Index(ind.v.filter(v => cv.v[v - 1] == k))
      ];
   }

   // function for creating indices of CV segments
   function getCVSplits(type, nSegments) {

      // reset all previous CV results
      yCV = Vector.fill(NaN, sampSize);
      localModel = undefined;
      statCV = undefined;
      indSeg = -1;

      if (type == "full") {
         return Index.seq(1, sampSize);
      }

      const nrep = Math.ceil(sampSize/nSegments);
      const ind = Index.seq(1, nSegments).rep(nrep).slice(1, sampSize);
      if (type == "venetian") {
         return ind;
      }

      return ind.shuffle();
   }

   $: console.log(indSeg)
   // function for running cross-validation iterations with delay
   async function run() {

      // reset all CV results
      yCV = Vector.fill(NaN, sampSize);
      statCV = undefined;
      indSeg = -1;

      // the cross-validation loop
      for (let i = 1; i <= max(splits); i++) {
         const [calInd, valInd] = cv2obs(splits, i);
         indSeg = i
         localModel = polyfit(sampX.subset(calInd), sampY.subset(calInd), pDegree);
         yCV = yCV.replace(polypredict(localModel, sampX.subset(valInd)), valInd);
         await timer(CVDELAY);
      }

      // set indSeg to -1 to remove last segment from plot and compute overall performance
      indSeg = -1;
      console.log(sampY, yCV)
      statCV = getStat(sampY, yCV);
      console.log(statCV)
   }

   $: pDegree = pDegrees[pName];

   // create global model for given polynomial degree
   $: globalModel = polyfit(sampX, sampY, pDegree);

   // make new CV segments
   $: splits = getCVSplits(cvType, nSegments);
   $: console.log(splits)
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-plot-area">
         <!-- scatter plot -->
         <AppPlot {splits} {indSeg} {statCV} {localModel} {globalModel} />
      </div>
      <div class="app-table-area">
         <!-- table -->
         <AppTable {splits} {indSeg} x={sampX} y={sampY} ycv={yCV} />
      </div>
      <div class="app-controls-area">
         <!-- Control elements -->
         <AppControlArea>
            <AppControlSwitch
               disable={indSeg > -1}
               id="cvType" label="CV"
               bind:value={cvType} options={["full", "random", "venetian"]}
            />
            <AppControlSwitch
               disable={indSeg > -1}
               id="pDegree" label="Polynomial"
               bind:value={pName} options={Object.keys(pDegrees)}
            />
            <AppControlButton
               disable={indSeg > -1}
               on:click={() => run()}
               id="runCV" label="" text="Run"></AppControlButton>
         </AppControlArea>
      </div>
   </div>

   <div slot="help">
      <h2>Cross-validation</h2>
      <p>
         Cross-validation is a way to estimate the sampling error without taking new samples from the population. The idea is to split your original observations to several segments and then, for each segment, make a local model by taking the segment observations out of the dataset, and use the rest for training the model. After that, the local model is used to predict
         the response values of the excluded observations. The procedure is repeated for each segment, so at the end every observation will have a predicted response value (<em>y</em><sub>cv</sub>).
      </p>
      <p>
         Splitting the observations into segments can be done in several ways. The simplest is to consider
         every observation as individual segment. In this case the number of segments is equal to the number of observations and thus on every step one observation will be taking out, while the rest will be used for training the local model. This way is called <em>leave-one-out</em> or <em>full cross-validation</em>. Alternatively you can assign two or more observations to each segment. This can be done randomly (<em>random segmented cross-validation</em>) or systematically by taking every k-th observation (<em>venetian blinds</em>).
      </p>
      <p>
         This app shows how all three methods work for a simple dataset with 12 observations. If random or systematic split is selected, number of segments will be equal to 4. Cross-validation can help to detect overfitting, you can also test this in the app — try to use overfitted model, e.g. cubic polynomial and will see that despite the calibration error is getting smaller, the cross-validation error will be larger for overcomplicated models.
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