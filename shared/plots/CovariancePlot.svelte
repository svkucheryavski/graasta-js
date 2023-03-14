<script>
   import { round } from 'mdatools/misc';
   import { max, min, mrange, mean} from 'mdatools/stat';
   import {Axes, XAxis, YAxis, Points, Segments, Rectangles, TextLabels} from 'svelte-plots-basic/2d';

   export let popX;
   export let popY;
   export let sampX;
   export let sampY;
   export let indNeg;
   export let indPos;
   export let indNeu;

   export let isInteractive = true;
   export let limX = undefined;
   export let limY = undefined;
   export let title = '';
   export let xLabel = 'x';
   export let yLabel = 'y';
   export let selectedPoint = -1;

   const popColor = '#e0e0e0';
   const segColor = '#a0a0a0';

   let selectionColor = 'transparent';
   let selX, selY, left, top, width, height;
   $: popY ? selectedPoint = -1 : '';
   $: limXLoc = limX !== undefined ? limX : mrange(popX);
   $: limYLoc = limY !== undefined ? limY : [min(popY) - 1, max(popY) + 1];

   $: sampMeanX = mean(sampX);
   $: sampMeanY = mean(sampY);
   $: negColor = selectedPoint > -1 ? '#0000ff60' : '#0000ff';
   $: posColor = selectedPoint > -1 ? '#ff000060' : '#ff0000';
   $: neuColor = selectedPoint > -1 ? '#f0f0f0' : '#a0a0a0';

   $: if (selectedPoint >= 0) {
         selX = sampX.v[selectedPoint - 1];
         selY = sampY.v[selectedPoint - 1];
         left = min([selX, sampMeanX]);
         top = max([selY, sampMeanY]);
         width = Math.abs(selX - sampMeanX);
         height = Math.abs(selY - sampMeanY);
   }

   function handleAxesClick(e) {
      selectedPoint = -1;
   }

   function handleMarkerClick(e) {
      if (!isInteractive) return;

      const id = parseInt(e.detail.elementID);
      if (id < 0) {
         selectedPoint = -1;
         return;
      }

      if (e.detail.seriesTitle === 'pos') {
         selectedPoint =  indPos.v[id];
         selectionColor = '#ff0000';
      } else if (e.detail.seriesTitle === 'neg') {
         selectedPoint =  indNeg.v[id];
         selectionColor = '#0000ff';
      } else {
         selectedPoint = -1;
         selectionColor = 'transparent';
      }
   }
</script>

<Axes on:axesclick={handleAxesClick} on:markerclick={handleMarkerClick}
   margins={[0.5, 0.75, 0.25, 0.25]}
   limX={limXLoc} limY={limYLoc} {title} {xLabel} {yLabel}>


   <Points xValues={popX} borderColor={popColor} yValues={popY} />
   {#if indNeu.length > 0}
   <Points title="neu" xValues={sampX.subset(indNeu)} yValues={sampY.subset(indNeu)} borderWidth={2} borderColor={neuColor}/>
   {/if}
   {#if indNeg.length > 0}
   <Points title="neg" xValues={sampX.subset(indNeg)} yValues={sampY.subset(indNeg)} borderWidth={2} borderColor={negColor}/>
   {/if}
   {#if indPos.length > 0}
   <Points title="pos" xValues={sampX.subset(indPos)} yValues={sampY.subset(indPos)} borderWidth={2} borderColor={posColor}/>
   {/if}

   {#if selectedPoint > 0}
      <Rectangles faceColor={selectionColor + "40"} left={[left]} top={[top]} width={[width]} height={[height]} />
      <Segments xStart={[selX, sampMeanX]} xEnd={[selX, selX]} yStart={[sampMeanY, selY]} yEnd={[selY, selY]} lineColor={selectionColor}/>
      <Points title="sel" xValues={[selX]} yValues={[selY]} borderWidth={2} borderColor={selectionColor} faceColor={selectionColor}/>
   {/if}

   <!-- position of mean values -->
   <Segments xStart={[sampMeanX]} xEnd={[sampMeanX]} yStart={[limYLoc[0]]} yEnd={[limYLoc[1]]} lineColor={segColor} lineType={2}/>
   <Segments xStart={[limXLoc[0]]} xEnd={[limXLoc[1]]} yStart={[sampMeanY]} yEnd={[sampMeanY]} lineColor={segColor} lineType={2}/>

   <!-- labels for mean values -->
   <TextLabels xValues={[limXLoc[0] + 5]} yValues={[sampMeanY]} labels={[round(sampMeanX, 1)]} pos={3} textSize={0.85} faceColor={segColor}/>
   <TextLabels xValues={[sampMeanX]} yValues={[limYLoc[1] - 5]} labels={[round(sampMeanY, 1)]} pos={2} textSize={0.85} faceColor={segColor}/>

   <!-- other plot elements -->
   <slot>
   </slot>

   <XAxis slot="xaxis" />
   <YAxis slot="yaxis" />
</Axes>
