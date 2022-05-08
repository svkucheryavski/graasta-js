<script>
   import {max, min, seq, subset, mrange, mean, qt, variance} from 'mdatools/stat';
   import {lmpredict} from 'mdatools/models';
   import {Axes, XAxis, YAxis, Segments, ScatterSeries, AreaSeries, LineSeries, TextLegend} from 'svelte-plots-basic';
   import { colors } from "../../shared/graasta";

   export let popModel;
   export let sampModel;
   export let selectedPoint = -1;
   export let errorType;


   let popColor = colors.plots.POPULATIONS[0];
   let popLineColor = "#a0a0a0";
   let selectionColor = "transparent";
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
   function getStatString(m, name) {
      return [`<tspan font-weight=bold>${name}:</tspan>`,
      `y =  <tspan fill="#ff0000" font-weight=bold>${m.coeffs.estimate[0].toFixed(2)}</tspan> +
            <tspan fill="#ff0000" font-weight=bold>${m.coeffs.estimate[1].toFixed(2)}</tspan> x`,
      `s(e) =  <tspan font-weight=bold>${m.stat.se.toFixed(2)}</tspan>`,
      `R2 =  <tspan font-weight=bold>${m.stat.R2.toFixed(2)}</tspan>`];
   }

   // statistics for population - only for using in this component therefore compute here not in main App

   // population and sample regression lines
   $: popX = popModel.data.X[0];
   $: popY = popModel.data.y;
   $: lineX = [min(popX), max(popX)];
   $: popLineY = lmpredict(popModel, lineX);
   $: popText = getStatString(popModel, "Population");

   // points and statistics for sample
   $: sampX = sampModel.data.X[0];
   $: sampY = sampModel.data.y;
   $: sampMeanX = mean(sampX);
   $: SSX = variance(sampX) * (sampX.length - 1);
   $: sampText = getStatString(sampModel, "Sample");
   $: sampLineY = lmpredict(sampModel, lineX);
   $: sampColor = colors.plots.SAMPLES[0] + (selectedPoint < 0 ? "" : "80");

   // fitting error for sample
   $: errorX = seq(lineX[0], lineX[1], 100);
   $: errorY = lmpredict(sampModel, errorX);
   $: errorMargin = errorX.map(x => getErrorMargin(x, errorType, sampModel.stat.se, sampMeanX, SSX));

   $: if (selectedPoint >= 0) {
         selX = subset(sampX, selectedPoint);
         selY = subset(sampY, selectedPoint);
         selYp = subset(sampModel.fitted, selectedPoint)[0];
         selErrMargin = getErrorMargin(selX, errorType, sampModel.stat.se, sampMeanX, SSX);
      }

   $: errorUpper = errorY.map((v, i) => v + errorMargin[i]);
   $: errorLower = errorY.map((v, i) => v - errorMargin[i]);
</script>

<Axes on:axesclick={handleAxesClick} on:markerclick={handleMarkerClick}
   limX={mrange(popX)} limY={mrange(popY)} xLabel="Height, m" yLabel="Weigh, kg">


   <ScatterSeries title="population" xValues={popX} borderColor={popColor} yValues={popY} />
   <LineSeries xValues={lineX} yValues={popLineY} lineColor={popLineColor}></LineSeries>


   <AreaSeries
      xValues={[...errorX, ...errorX.slice().reverse()]}
      yValues={[...errorUpper, ...errorLower.slice().reverse()]}
      lineColor={"transparent"}
      fillColor={sampColor}
      opacity={0.1}
   />

   <ScatterSeries
      title="sample"
      xValues={sampX}
      yValues={sampY}
      borderWidth={2}
      borderColor={sampColor}
   />

   <LineSeries xValues={lineX} yValues={sampLineY} lineColor={sampColor}></LineSeries>

   {#if selectedPoint > 0}
      <ScatterSeries title="sel" xValues={[selX]} yValues={[selY]} borderWidth={2} borderColor={selectionColor} />
      <ScatterSeries title="sel" xValues={[selX]} yValues={[selYp]} markerSize={0.65}
         borderWidth={2} borderColor={selectionColor} faceColor={selectionColor}/>
      <ScatterSeries title="sel" xValues={[selX]} yValues={[selYp + selErrMargin]} markerSize={0.65}
         borderWidth={2} borderColor={selectionColor} faceColor={selectionColor} />
      <ScatterSeries title="sel" xValues={[selX]} yValues={[selYp - selErrMargin]} markerSize={0.65}
         borderWidth={2} borderColor={selectionColor} faceColor={selectionColor}/>
      <Segments xStart={[selX]} xEnd={[selX]} yStart={[selYp - selErrMargin]} yEnd={[selYp + selErrMargin]}
         lineType={3} lineColor={selectionColor} />
   {/if}

   <!-- statistics -->
   <TextLegend textSize={1.05} left={min(popX)} top={max(popY)} dx="1em" dy="1.35em" elements={popText} />
   <TextLegend textSize={1.05} left={min(popX) * 0.35 + max(popX) * 0.65} top={min(popY) * 0.8 + max(popY) * 0.2} dx="1em" dy="1.35em" elements={sampText} />

   <XAxis slot="xaxis" />
   <YAxis slot="yaxis" />
   <slot>

   </slot>
</Axes>
