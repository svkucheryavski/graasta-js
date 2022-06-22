<script>
   import {rnorm, subset, mean, sum, rep, sort, seq, shuffle} from 'mdatools/stat';
   import {polyfit, polypredict} from 'mdatools/models';
   import {tomatrix, vreplace, vsubtract, vapply, transpose} from 'mdatools/matrix';

   // shared components
   import {default as StatApp} from "../../shared/StatApp.svelte";

   // shared components - controls
   import AppControlArea from "../../shared/controls/AppControlArea.svelte";
   import AppControlButton from "../../shared/controls/AppControlButton.svelte";
   import AppControlSwitch from '../../shared/controls/AppControlSwitch.svelte';

   // local components
   import AppTable from "./AppTable.svelte";
   import AppPlot from "./AppPlot.svelte";

   // delay for CV runs in ms
   const CVDELAY = 1000;

   // initial values for managable parameters
   let cvType = "random";
   let pDegree = 1;

   // constant parameters
   const nSegments = 4;
   const sampSize = 12;
   const meanX = 0;
   const sdX = 1;
   const noise = 0.5;

   // create a sample
   const sampZ = rnorm(sampSize);
   const sampX = sort(rnorm(sampSize, meanX, sdX));
   const sampY = sampX.map((x, i) => -2 + 2.5 * x + noise * sampZ[i]);

   // timer for delay
   const timer = ms => new Promise(res => setTimeout(res, ms))

   // runtime parameters
   let segments = {}
   let indSeg = -1;
   let yCV = rep(NaN, sampSize);
   let statCV = undefined;
   let localModel = undefined;

   // function for compoting R2 and se for a model
   function getStat(y, yp, p) {
      const SSE = sum(vapply(vsubtract(y, yp), v => v ** 2));
      const SSY = sum(vapply(vsubtract(y, mean(y)), v => v ** 2));
      const DoF = y.length - (pDegree + 1);
      return {R2: 1 - SSE/SSY, se: Math.sqrt(SSE/DoF)}
   }

   // function for creating indices of CV segments
   function getCVSegments(type, nSegments) {

      // reset all previous CV results
      yCV = rep(NaN, sampSize);
      localModel = undefined;
      statCV = undefined;
      indSeg = -1;

      // create vector with row indices
      let indAll = seq(1, sampSize);
      if (type === "random") {
         indAll = shuffle(indAll);
      }

      // create vector of indices for the local validation sets
      let segSize = 1;
      let segVal = transpose(seq(1, sampSize));
      if (type !== "full") {
         segSize = sampSize / nSegments;
         segVal = transpose(tomatrix(indAll, nSegments, segSize));
      }

      // create vector of indices for the local calibration sets
      const segCal = segVal.map(v => indAll.filter(x => !v.includes(x)));

      // create vector of segment number for each data row
      let segNum = rep(0, sampSize)
      for (let i = 0; i < segVal.length; i++) {
         segNum = vreplace(segNum, rep(i + 1, segSize), segVal[i])
      }

      return {cal: segCal, val: segVal, num: segNum}
   }

   // function for running cross-validation iterations with delay
   async function run() {

      // reset all CV results
      yCV = rep(NaN, sampSize)
      statCV = undefined;
      indSeg = -1;

      // the cross-validation loop
      for (let i = 0; i < segments.val.length; i++) {
         indSeg = i
         localModel = polyfit(subset(sampX, segments.cal[indSeg]), subset(sampY, segments.cal[indSeg]), pDegree);
         yCV = vreplace(yCV, polypredict(localModel, subset(sampX, segments.val[indSeg])), segments.val[indSeg]);

         await timer(CVDELAY);
      }

      // set indSeg to -1 to remove last segment from plot and compute overall performance
      indSeg = -1;
      statCV = getStat(sampY, yCV);
   }

   // create global model for given polynomial degree
   $: globalModel = polyfit(sampX, sampY, pDegree);

   // make new CV segments
   $: segments = getCVSegments(cvType, nSegments);
</script>

<StatApp>
   <div class="app-layout">

      <div class="app-plot-area">
         <!-- scatter plot -->
         <AppPlot {segments} {indSeg} {statCV} {localModel} {globalModel} />
      </div>
      <div class="app-table-area">
         <!-- table -->
         <AppTable {segments} {indSeg} x={sampX} y={sampY} ycv={yCV} />
      </div>
      <div class="app-controls-area">
         <!-- Control elements -->
         <AppControlArea>
            <AppControlSwitch
               id="cvType" label="CV"
               bind:value={cvType} options={["full", "random", "venetian"]}
            />
            <AppControlSwitch
               id="pDegree" label="Polynomial"
               bind:value={pDegree} options={[1, 2, 3]}
            />
            <AppControlButton
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
   grid-template-columns: minmax(65%, 80%) minmax(350px, 500px);
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