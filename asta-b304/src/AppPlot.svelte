<script>
   import { lmpredict } from 'mdatools/models';
   import { max, min, mean, variance } from 'mdatools/stat';
   import { reshape, vector, Vector } from 'mdatools/arrays';
   import { qt } from 'mdatools/distributions';

   import {Axes, XAxis, YAxis, Segments, Points, Area, Lines, TextLegend} from 'svelte-plots-basic/2d';

   import { colors } from '../../shared/graasta';

   export let popModel;
   export let sampModel;
   export let selectedPoint = -1;
   export let errorType;


   let popColor = '#f0f0f0';
   let popLineColor = '#a0a0a0';
   let selectionColor = 'transparent';
   let selX, selY, selYp, selErrMargin;

   $: tCrit = qt(0.975, sampModel.stat.DoF);

   function handleAxesClick(e) {
      selectedPoint = -1;
   }

   function handleMarkerClick(e) {

      const id = parseInt(e.detail.elementID);
      if (id < 0) {
         selectedPoint = -1;
         return;
      }

      selectedPoint =  id + 1;
      selectionColor = colors.plots.SAMPLES[0];
   }

   // function to compute error margin
   function getErrorMargin(x, errorType, sampSE, sampMeanX, SSX) {

      if (errorType == "fitting") {
         return tCrit * sampSE
      }

      if (errorType == "sampling") {
         return tCrit * sampSE * Math.sqrt(1 / 10 + (x - sampMeanX)**2 / SSX)
      }

      return  tCrit * sampSE * Math.sqrt(1 + 1 / 10 + (x - sampMeanX)**2 / SSX)
   }

   // function to show model info
   function getStatString(m, name, color) {
      return [`<tspan font-weight=bold>${name}:</tspan>`,
      `y =  <tspan fill="${color}" font-weight=bold>${m.coeffs.estimate.v[0].toFixed(2)}</tspan> +
            <tspan fill="${color}" font-weight=bold>${m.coeffs.estimate.v[1].toFixed(2)}</tspan> x`,
      `s(e) =  <tspan font-weight=bold>${m.stat.se.toFixed(2)}</tspan>`,
      `R2 =  <tspan font-weight=bold>${m.stat.R2.toFixed(2)}</tspan>`];
   }

   // statistics for population - only for using in this component therefore compute here not in main App

   // population and sample regression lines
   $: popX = popModel.data.X.getcolumn(1);
   $: popY = popModel.data.y;

   $: lineX = vector([min(popX), max(popX)]);
   $: popLineY = lmpredict(popModel, reshape(lineX, 2, 1));
   $: popText = getStatString(popModel, 'Population', '#a0a0a0');

   // points and statistics for sample
   $: sampX = sampModel.data.X.getcolumn(1);
   $: sampY = sampModel.data.y;
   $: sampMeanX = mean(sampX);
   $: SSX = variance(sampX) * (sampX.length - 1);
   $: sampText = getStatString(sampModel, 'Sample', colors.plots.SAMPLES[0]);
   $: sampLineY = lmpredict(sampModel, lineX);
   $: sampColor = colors.plots.SAMPLES[0] + (selectedPoint < 0 ? '' : '80');

   // fitting error for sample
   $: errorX = Vector.seq(lineX.v[0], lineX.v[1], 1/100);
   $: errorY = lmpredict(sampModel, errorX);
   $: errorMargin = errorX.apply(x => getErrorMargin(x, errorType, sampModel.stat.se, sampMeanX, SSX));

   $: if (selectedPoint >= 0) {
         selX = sampX.v[selectedPoint - 1];
         selY = sampY.v[selectedPoint - 1];
         selYp = sampModel.fitted.v[selectedPoint - 1];
         selErrMargin = getErrorMargin(selX, errorType, sampModel.stat.se, sampMeanX, SSX);
      }

   $: errorUpper = errorY.add(errorMargin);
   $: errorLower = errorY.subtract(errorMargin);
</script>

<Axes on:axesclick={handleAxesClick} on:markerclick={handleMarkerClick}
   margins={[0.75, 0.75, 0.25, 0.25]}
   limX={[1.3, 2.0]} limY={[35, 100]} xLabel="Height, m" yLabel="Weigh, kg">


   <!-- points and model for population -->
   <Points title="population" xValues={popX} borderColor={popColor} faceColor={popColor} yValues={popY} />
   <Lines xValues={lineX} yValues={popLineY} lineColor={popLineColor} />

   <!-- top part of uncertainty area -->
   <Area
      xValues={Vector.c(errorX.v[0], errorX, errorX.v[errorX.length - 1], errorX.v[0])}
      yValues={Vector.c(errorY.v[0], errorUpper, errorY.v[errorY.length - 1], errorY.v[0])}
      lineColor={"transparent"}
      fillColor={sampColor}
      opacity={0.1}
   />

   <!-- bottom part of uncertainty area -->
   <Area
      xValues={Vector.c(errorX.v[0], errorX, errorX.v[errorX.length - 1], errorX.v[0])}
      yValues={Vector.c(errorY.v[0], errorLower, errorY.v[errorY.length - 1], errorY.v[0])}
      lineColor={"transparent"}
      fillColor={sampColor}
      opacity={0.1}
   />

   <!-- points and model for sample -->
   <Points title="sample" xValues={sampX} yValues={sampY} borderWidth={2} borderColor={sampColor}/>
   <Lines xValues={lineX} yValues={sampLineY} lineColor={sampColor} />

   <!-- uncertainty for selected point -->
   {#if selectedPoint > 0}
      <Points title="sel" xValues={[selX]} yValues={[selY]} borderWidth={2} borderColor={selectionColor} />
      <Points title="sel" xValues={[selX]} yValues={[selYp]} markerSize={0.65}
         borderWidth={2} borderColor={selectionColor} faceColor={selectionColor}/>
      <Points title="sel" xValues={[selX]} yValues={[selYp + selErrMargin]} markerSize={0.65}
         borderWidth={2} borderColor={selectionColor} faceColor={selectionColor} />
      <Points title="sel" xValues={[selX]} yValues={[selYp - selErrMargin]} markerSize={0.65}
         borderWidth={2} borderColor={selectionColor} faceColor={selectionColor}/>
      <Segments xStart={[selX]} xEnd={[selX]} yStart={[selYp - selErrMargin]} yEnd={[selYp + selErrMargin]}
         lineType={3} lineColor={selectionColor} />
   {/if}

   <!-- statistics -->
   <TextLegend textSize={1.05} left={1.35} top={92} dx="1em" dy="1.35em" elements={popText} />
   <TextLegend textSize={1.05} left={1.75} top={50} dx="1em" dy="1.35em" elements={sampText} />

   <XAxis slot="xaxis" />
   <YAxis slot="yaxis" />
   <slot>

   </slot>
</Axes>
