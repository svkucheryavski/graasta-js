<script>
   // shared components
   import {default as StatApp} from "../../shared/StatApp.svelte";

   // shared components - controls
   import AppControlArea from "../../shared/controls/AppControlArea.svelte";
   import AppControlRange from "../../shared/controls/AppControlRange.svelte";
   import AppControlSelect from '../../shared/controls/AppControlSelect.svelte';
   import {colors} from '../../shared/graasta';

   // local components
   import AppPlot from "./AppPlot.svelte";
   import ModelPlot from "./ModelPlot.svelte";
   import PointPlot from "./PointPlot.svelte";
   import PointLineEquation from './PointLineEquation.svelte';

   // constant parameters
   const X1Range = [1, 4];
   const X2Range = [1, 4];
   const modelColor = "#a0a0ef70";
   const pointColor = colors.plots.SAMPLES[0];

   // axes limits (a bit wider the X range)
   const limX = [0, 5];
   const limY = [0, 15];
   const limZ = [0, 5];


   // regression coefficients
   let b0 = 10;
   let b1 = 0.1;
   let b2 = 0.1;
   let b12 = 0.00;

   // coordinates of the selected point
   let pX1 = 2.0;
   let pX2 = 2.0;

   // model lines mode
   let showLines = "Both";

   // combine coefficients to a vector
   $: coeffs = [b0, b1, b2, b12];
</script>

<StatApp>
   <div class="app-layout">
      <div class="app-eq-area">
         <!-- Line equation for selected point -->
         <PointLineEquation {pX1} {pX2} {coeffs} {showLines} />
      </div>
      <div class="app-plot-area">
         <!-- 3D plot -->
         <AppPlot {limX} {limY} {limZ}>
            <PointPlot color={pointColor} {coeffs} {pX1} {pX2} {X1Range} {X2Range} {showLines} />
            <ModelPlot color={modelColor} {coeffs} {X1Range} {X2Range} {showLines} />
         </AppPlot>
      </div>

      <div class="app-controls-area">
         <!-- Control elements for point -->
         <AppControlArea>
            <AppControlSelect id="showLines" label="Show lines" bind:value={showLines} options={["X1", "X2", "Both"]} />
            <AppControlRange id="pX1" label="point X<sub>1</sub>" bind:value={pX1} min={1} max={4} step={0.1} decNum={1}/>
            <AppControlRange id="pX2" label="point X<sub>2</sub>" bind:value={pX2} min={1} max={4} step={0.1} decNum={1}/>
         </AppControlArea>

         <!-- Control elements for model -->
         <AppControlArea>
            <AppControlRange id="b0" label="b<sub>0</sub>" bind:value={b0} min={5} max={15}  step={0.1} decNum={1}/>
            <AppControlRange id="b1" label="b<sub>1</sub>" bind:value={b1} min={-1} max={1}  step={0.1} decNum={1}/>
            <AppControlRange id="b2" label="b<sub>2</sub>" bind:value={b2} min={-1} max={1}  step={0.1} decNum={1}/>
            <AppControlRange id="b12" label="b<sub>12</sub>" bind:value={b12} min={-0.5} max={0.5} step={0.02} decNum={2} />
         </AppControlArea>
      </div>
   </div>

   <div slot="help">
      <h2>Multiple linear regression model</h2>
      <p>This app helps to understand a Multiple Linear Regression model, where a response variable (<em>y</em>) depends on two predictors (<em>X</em><sub>1</sub> and <em>X</em><sub>2</sub>) as well as on their interaction. The model is represented by a set of four coefficients, <em>b</em><sub>0</sub> (bias or intercept), <em>b</em><sub>1</sub> (effect of <em>X</em><sub>1</sub>), <em>b</em><sub>2</sub> (effect of <em>X</em><sub>2</sub>) and <em>b</em><sub>12</sub> (effect of interaction between <em>X</em><sub>1</sub> and <em>X</em><sub>2</sub>). You can change the values of the coefficients using corresponding controls.
      </p>
      <p>
      The model is visualized as a surface in (<em>X</em><sub>1</sub>, <em>X</em><sub>2</sub>, <em>y</em>) Cartesian space as it is shown on the 3D plot. The model surface is represented by a two sets of parallel straight lines. One set of lines shows how <em>y</em> depends on <em>X</em><sub>1</sub>, when <em>X</em><sub>2</sub> has different fixed values (one line for each fixed <em>X</em><sub>2</sub>). The second set of lines, which is orthogonal to the first set, shows how <em>y</em> depends on <em>X</em><sub>2</sub> when <em>X</em><sub>1</sub> has different fixed values. You can show both sets or only one of them by using control element "Show lines".
      </p>
      <p>
         The 3D scene can be rotated and zoomed in/out. You can do it with a mouse (drag for rotation and scroll for zooming) or by keyboard (arrows for rotation and "+", "-" for zooming). You can also see a selected point whose X-coordinates you can change. As well as the equation, which shows how y-value of this point is computed using the current model.
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
      "eq controls"
      "plot controls";
   grid-template-rows: min-content 1fr;
   grid-template-columns: 65% minmax(350px, 35%);
}

.app-eq-area {
   grid-area: eq;
}

.app-plot-area {
   grid-area: plot;
}

.app-controls-area {
   padding-left: 1em;
   grid-area: controls;
}

.app-controls-area > :global(*){
   margin: 1em 0;
}

</style>