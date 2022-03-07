<script>
   import {max, min, round, cov, subset} from 'mdatools/stat';
   import {Axes, XAxis, YAxis, ScatterSeries, Segments, Rectangles, TextLabels} from 'svelte-plots-basic';

   export let popX;
   export let popY;
   export let sampX;
   export let sampY;
   export let limX = [60, 140];
   export let limY = [20, 200];
   export let title ="";
   export let xLabel = "x";
   export let yLabel = "y";
   export let indNeg;
   export let indPos;
   export let indNeu;
   export let sampMeanX;
   export let sampMeanY;
   export let selectedPoint = -1;

   const popColor = "#e0e0e0";
   const segColor = "#a0a0a0";

   let selectionColor = "transparent";
   let selX, selY, left, top, width, height;

   $: negColor = selectedPoint > -1 ? "#0000ff60" : "#0000ff";
   $: posColor = selectedPoint > -1 ? "#ff000060" : "#ff0000";
   $: neuColor = selectedPoint > -1 ? "#f0f0f0" : "#a0a0a0";

   $: if (selectedPoint >= 0) {
         selX = subset(sampX, selectedPoint);
         selY = subset(sampY, selectedPoint);
         left = min([selX, sampMeanX]);
         top = max([selY, sampMeanY]);
         width = Math.abs(selX - sampMeanX);
         height = Math.abs(selY - sampMeanY);
      }

   function covText(x, y, name) {
      return name + ": cov(x, y) = <tspan style='font-weight:bold'>" + cov(x, y).toFixed(1) + "</tspan>";
   }

   function handleAxesClick(e) {
      selectedPoint = -1;
   }

   function handleMarkerClick(e) {

      const id = parseInt(e.detail.elementID);
      if (id < 0) {
         selectedPoint = -1;
         return;
      }

      if (e.detail.seriesTitle === "pos") {
         selectedPoint =  indPos[id];
         selectionColor = "#ff0000";
      } else if (e.detail.seriesTitle === "neg") {
         selectedPoint =  indNeg[id];
         selectionColor = "#0000ff";
      } else {
         selectedPoint = -1;
         selectionColor = "transparent";
      }
   }
</script>

<Axes on:axesclick={handleAxesClick} on:markerclick={handleMarkerClick} {limX} {limY} {title} {xLabel} {yLabel}>
   <ScatterSeries xValues={popX} borderColor={popColor} yValues={popY} />
   <ScatterSeries title="neg" xValues={subset(sampX, indNeg)} yValues={subset(sampY, indNeg)} borderWidth={2} borderColor={negColor}/>
   <ScatterSeries title="pos" xValues={subset(sampX, indPos)} yValues={subset(sampY, indPos)} borderWidth={2} borderColor={posColor}/>
   <ScatterSeries title="neu" xValues={subset(sampX, indNeu)} yValues={subset(sampY, indNeu)} borderWidth={2} borderColor={neuColor}/>

   {#if selectedPoint > 0}
      <Rectangles faceColor={selectionColor + "40"} left={[left]} top={[top]} width={[width]} height={[height]} />
      <Segments xStart={[selX, sampMeanX]} xEnd={[selX, selX]} yStart={[sampMeanY, selY]} yEnd={[selY, selY]} lineColor={selectionColor} />
      <ScatterSeries title="sel" xValues={[selX]} yValues={[selY]} borderWidth={2} borderColor={selectionColor} faceColor={selectionColor} />
   {/if}

   <!-- position of mean values -->
   <Segments xStart={[sampMeanX]} xEnd={[sampMeanX]} yStart={[limY[0]]} yEnd={[limY[1]]} lineColor={segColor} lineType={2} />
   <Segments xStart={[limX[0]]} xEnd={[limY[1]]} yStart={[sampMeanY]} yEnd={[sampMeanY]} lineColor={segColor} lineType={2} />

   <!-- labels for mean values -->
   <TextLabels xValues={[limX[0] + 5]} yValues={[sampMeanY]} labels={[round(sampMeanX, 1)]} pos={3} textSize={0.85} faceColor="#a0a0a0"/>
   <TextLabels xValues={[sampMeanX]} yValues={[limY[1] - 5]} labels={[round(sampMeanY, 1)]} pos={2} textSize={0.85} faceColor="#a0a0a0"/>

   <!-- labels for covariance -->
   <TextLabels xValues={[limX[0]]} yValues={[limY[1] - 5]} labels={[covText(sampX, sampY, "sample")]} pos={2} textSize={0.85} faceColor="#606060"/>
   <TextLabels xValues={[limX[0]]} yValues={[limY[1] - 12]} labels={[covText(popX, popY, "pop")]} pos={2} textSize={0.85} faceColor="#606060"/>

   <XAxis slot="xaxis" />
   <YAxis slot="yaxis" />
   <slot>

   </slot>
</Axes>
