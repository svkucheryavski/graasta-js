<script>
	import { setContext, createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';

   /* input parameters */
   export let limX = [undefined, undefined];    // limits for x-axis (in plot units) [min, max]
   export let limY = [undefined, undefined];    // limits for y-axis (in plot units) [min, max]
   export let title = "";                       // title of the plot
   export let xLabel = "";                      // label for x-axis
   export let yLabel = "";                      // label for y-axis
   export let multiSeries = true;               // is the plot for one series or for many

   // event dispatcher
   const dispatch = createEventDispatcher();

   // how big are margins (number of pixels in unit margin value) between axis and plot area if axis are shown
   const AXES_MARGIN_FACTORS = {
      "small": 30,
      "medium": 40,
      "large": 50
   }

   // number of ticks along each axis
   const TICK_NUM = {
      "small": 5,
      "medium": 8,
      "large": 12
   };

   // margin between plot series elements and data labels
   const LABELS_MARGIN = {
      "small": 10,
      "medium": 15,
      "large": 20
   };


   // line styles for different scales and types
   const LINE_STYLES = {
      small: ["0", "3,3", "1,1", "3,1"],
      medium: ["0", "5,5", "2,2", "5,2"],
      large: ["0", "7,7", "3,3", "7,3"],
   }

   // constant to make clip path ID unique
   const clipPathID = "plottingArea" + Math.round(Math.random() * 10000);

   /* parameters for internal use inside the component */
   let plotElement;
   let axesElement;
   let axesMargins = [0.034, 0.034, 0.034, 0.034];    // initial margins (will be multiplied to FACTORS)

   /* reactive parameters to be shared with children via context */
   const width = writable(100);                       // actual width of plotting area in pixels
   const height = writable(100);                      // actual height of plotting area in pixels
   const xLim = writable([undefined, undefined]);     // actual limits for x-axis in plot units
   const yLim = writable([undefined, undefined]);     // actual limits for y-axis in plot units
   const scale = writable("medium");                  // scale factor (how big the shown plot is)
   const isOk = writable(false);                      // are axes ready for drawing

   /** Adds margins for x-axis (e.g. when x-axis must be shown) */
   const addXAxisMargins = function() {
      axesMargins[0] = 1;
      axesMargins[2] = 0.5;
      axesMargins[1] = axesMargins[1] > 0.5 ? axesMargins[1] : 0.5;
      axesMargins[3] = axesMargins[3] > 0.5 ? axesMargins[3] : 0.5;
   }

   /** Adds margins for y-axis (e.g. when y-axis must be shown) */
   const addYAxisMargins = function() {
      axesMargins[1] = 1;
      axesMargins[3] = 0.5;
      axesMargins[0] = axesMargins[0] > 0.5 ? axesMargins[0] : 0.5;
      axesMargins[2] = axesMargins[2] > 0.5 ? axesMargins[2] : 0.5;
   }

   /** Adjusts limits for x-axis (e.g. when new series is added)
    *  @param {Array} newLim - vector with new limits  (two values)
    */
   const adjustXAxisLimits = function(newLim) {
      if (!limX.some(v => v === undefined)) return;
      xLim.update(lim => adjustAxisLimits(lim, newLim));
   }

   /** Adjusts limits for y-axis (e.g. when new series is added)
    *  @param {Array} newLim - vector with new limits  (two values)
    */
   const adjustYAxisLimits = function(newLim) {
      if (!limY.some(v => v === undefined)) return;
      yLim.update(lim => adjustAxisLimits(lim, newLim));
   }

   /** Adjusts x- or y- axis limits (e.g. when new elements are added)
    *  @param {Array} lim - vector with limits for current axis (two values)
    *  @param {Array} newLim - vector with new limits  (two values)
    *  @returns {Array} vector with rescaled values
    *
    *  The new limits are set separately for min and max. Either if current value is undefined or
    *  if new value is outside the current limits (smaller than min or larger than max).
    */
   const adjustAxisLimits = function(lim, newLim) {

      let adjustedLim = [
         (lim[0] !== undefined && multiSeries === true && lim[0] < newLim[0]) ? lim[0] : newLim[0],
         (lim[1] !== undefined && multiSeries === true && lim[1] > newLim[1]) ? lim[1] : newLim[1]
      ];

      // special case when both limits are zero
      if (adjustedLim[0] === 0 && adjustedLim[1] === 0) {
         adjustedLim = [-0.1, 0.1];
      }

      // special case when limits are equal (add ±5%)
      if (adjustedLim[0] === adjustedLim[1]) {
         adjustedLim = [adjustedLim[0] * 0.95, adjustedLim[0] * 1.05];
      }

      return adjustedLim;
   }

   /** Rescales x-values from plot coordinates to screen (SVG) coordinates
    *  @param {Array} x - vector with coordinates (or objects size) in original plot coordinates
    *  @param {Array} xLim - vector with current limits for x-axis in original plot coordinates
    *  @param {number} width - width of coordinate system in pixels
    *  @param {boolean} doSizeScreen - scale size of objects (true) or coordinates
    *  @returns {Array} vector with rescaled values
    */
   const scaleX = function(x, xLim, width, doSizeScale = false) {
      if (!$isOk  || x === undefined || !Array.isArray(x)) return undefined;

      if (doSizeScale) {
         // scale size of objects instead of coordinates
         return x.map(v => v / (xLim[1] - xLim[0]) * (width - margins[1] - margins[3]));
      }

      return x.map(v => (v - xLim[0]) / (xLim[1] - xLim[0]) * (width - margins[1] - margins[3]) + margins[1]);
   }

   /** Rescales x-values from plot coordinates to screen (SVG) coordinates
    *  @param {Array} x - vector with coordinates (or objects size) in original plot coordinates
    *  @param {Array} xLim - vector with current limits for x-axis in original plot coordinates
    *  @param {number} width - width of coordinate system in pixels
    *  @param {boolean} doSizeScreen - scale size of objects (true) or coordinates
    *  @returns {Array} vector with rescaled values
    */
   const scaleY = function(y, yLim, height, doSizeScale = false) {
      if (!$isOk  || y === undefined || !Array.isArray(y)) return undefined;

      if (doSizeScale) {
         // scale size of objects instead of coordinates
         return y.map(v => v / (yLim[1] - yLim[0]) * (height - margins[0] - margins[2]));
      }

      // for coordinates we also need to invert (flip) the y-axis
      return y.map(v => (yLim[1] - v) / (yLim[1] - yLim[0]) * (height - margins[0] - margins[2]) + margins[2]);
   }

   /** Computes nice tick values for axis
    * @param {Array} ticks - vector with ticks if alredy available (if not, new will be computed)
    * @param {Array} lim - vector with axis limits tickets must be computed for
    * @param {number} maxTickNum - maximum number of ticks to compute
    * @param {boolean} round - round or not the fractions when computing nice numbers for the ticks
    * @returns {Array} a vector with computed tick positions
    */
   const getAxisTicks = function(ticks, lim, maxTickNum, round = true) {

      // if ticks are already provided do not recompute them
      if (ticks !== undefined) return ticks;

      // check if limits are ok
      if (!Array.isArray(lim) || lim[0] === undefined || lim[1] === undefined) return undefined;

      // get range as a nice number and compute min, max and steps for the tick sequence
      const range = niceNum(lim[1] - lim[0], round);
      const tickSpacing = niceNum(range / (maxTickNum - 1), round);
      const tickMin = Math.ceil(lim[0] / tickSpacing) * tickSpacing;
      const tickMax = Math.floor(lim[1] / tickSpacing) * tickSpacing;

      // recompute maxTickNum
      maxTickNum = Math.round((tickMax - tickMin + 1) / tickSpacing) + 1;

      // create a sequence and return
      ticks = [...Array(maxTickNum)].map((x, i) => tickMin + i * tickSpacing);

      // if step is smaller than 1 round values to remove small decimals accidentiall added by JS
      if (Math.abs(tickSpacing) < 1) {
         const r = Math.pow(10, 1 + Math.round(-Math.log10(tickSpacing)));
         ticks = ticks.map(v => Math.round((v + Number.EPSILON) * r) / r)
      }

      // make sure the ticks are not aligned with axes limits
      return ticks.filter(x => x >= lim[0] & x <= lim[1]);
   }

   /** Computes a nice spacing value for a given range
    * @param {numeric} localRange - a range (max - min)
    * @param {boolean} round - round or not the fractions when computing the number
    * @returns {numeric} the computed spacing value
    */
   function niceNum( localRange,  round) {

      const exponent = Math.floor(Math.log10(localRange));
      const fraction = localRange / Math.pow(10, exponent);
      let niceFraction;

      if (round) {
         if (fraction < 1.5)
            niceFraction = 1;
         else if (fraction < 3)
            niceFraction = 2;
         else if (fraction < 7)
            niceFraction = 5;
         else
            niceFraction = 10;
      } else {
         if (fraction <= 1)
            niceFraction = 1;
         else if (fraction <= 2)
            niceFraction = 2;
         else if (fraction <= 5)
            niceFraction = 5;
         else
            niceFraction = 10;
      }

      return niceFraction * Math.pow(10, exponent);
   }

   /** Computes a scale level
    * @param {numeric} width - width of plotting area in pixels
    * @param {numeric} height - height of plotting area in pixels
    * @returns {text} the scale level ("small", "medium" or "large")
    */
   function getScale(width, height) {
      if (height < 300.2 || width < 300.2) return "small";
      if (height < 600.2 || width < 600.2) return "medium";
      return "large";
   }

   /* context with Axes constants, properties and methods to share with children */
   let context = {

      // methods
      addXAxisMargins: addXAxisMargins,
      addYAxisMargins: addYAxisMargins,
      adjustXAxisLimits: adjustXAxisLimits,
      adjustYAxisLimits: adjustYAxisLimits,
      getAxisTicks: getAxisTicks,
      scaleX: scaleX,
      scaleY: scaleY,

      // variables
      isOk: isOk,
      scale: scale,
      width: width,
      height: height,
      xLim: xLim,
      yLim: yLim,

      // constants
      LINE_STYLES: LINE_STYLES,
      LABELS_MARGIN: LABELS_MARGIN,
      TICK_NUM: TICK_NUM,
   }

	setContext('axes', context);

   // handle click on plot elements and dispatch manual events
   function dispatchClickEvent(eventName, el) {
      dispatch(eventName, {seriesTitle: el.parentNode.getAttribute('title'), elementID: el.dataset.id});
   }

   function handleClick(e) {

      // scatter plot markers
      if (e.target.tagName === "text" && e.target.parentNode.classList.contains("series_scatter")) {
         dispatchClickEvent("markerclick", e.target);
         return;
      }

      // bar plot bars
      if (e.target.tagName === "rect" && e.target.parentNode.classList.contains("series_bar")) {
         dispatchClickEvent("barclick", e.target);
         return;
      }

      // outside any plot element
      dispatch("axesclick")
   }


   // this is reactive in case if limX and limY are interactively changed by parent script
   $: if (!limX.some(v => v === undefined)) xLim.update(v => limX);
   $: if (!limY.some(v => v === undefined)) yLim.update(v => limY);

   // computes real margins in pixels based on current scale
   $: margins = axesMargins.map(v => v * AXES_MARGIN_FACTORS[$scale]);

   // computes status which tells that axes limits look fine and it is safe to draw
   // the status is based on the axis limits validity
   $: isOk.update(v =>
      Array.isArray($yLim) &&
      Array.isArray($xLim) &&
      $xLim.length === 2 &&
      $yLim.length === 2 &&
      !$yLim.some(v => v === undefined) &&
      !$xLim.some(v => v === undefined) &&
      !$yLim.some(v => isNaN(v)) &&
      !$xLim.some(v => isNaN(v)) &&
      $xLim[1] !== $xLim[0] &&
      $yLim[1] !== $yLim[0] &&
      $width > (margins[1] + margins[3]) &&
      $height > (margins[0] + margins[2])
   )

   // computes coordinates for clip path box
   $: cpx = $isOk ? scaleX($xLim, $xLim, $width) : [0, 1];
   $: cpy = $isOk ? scaleY($yLim, $yLim, $height) : [1, 0];

   /* observer for the axes area size - to update size of axes */
    const ro2 = new ResizeObserver(entries => {
       for (let entry of entries) {
         const acr = axesElement.getBoundingClientRect();
         width.update(x => acr.width);
         height.update(x => acr.height);
       }
    });

   /* observer for the plot area size — to update scale */
    const ro1 = new ResizeObserver(entries => {
       for (let entry of entries) {
         const pcr = plotElement.getBoundingClientRect();
         scale.update(x => getScale(pcr.width, pcr.height));
       }
    });

    onMount(() => {
       ro1.observe(plotElement);
       ro2.observe(axesElement);
    });

    onDestroy(() => {
       ro1.unobserve(plotElement);
       ro2.unobserve(axesElement);
    })
</script>


<div class="plot {'plot_' + $scale}"  bind:this={plotElement} class:plot_error="{!$isOk}">

   <!-- plot title and axis labels -->
   {#if title !== ""}<div class="axes__title">{@html title}</div>{/if}
   {#if yLabel !== ""}<div class="axes__ylabel"><span>{@html yLabel}</span></div>{/if}
   {#if xLabel !== ""}<div class="axes__xlabel"><span>{@html xLabel}</span></div>{/if}

   <!-- axes (coordinate system) -->
   <div class="axes-wrapper" bind:this={axesElement} >
      <svg on:click={handleClick} preserveAspectRatio="none" class="axes">

         <!-- define clipping path -->
         <defs>
            <clipPath id="{clipPathID}">
               <rect style="pointer-events:none" x="{cpx[0]}" y="{cpy[1]}" width = "{cpx[1] - cpx[0]}" height="{cpy[0] - cpy[1]}"></rect>
            </clipPath>
         </defs>

         <!-- axis and box -->
         <slot name="xaxis"></slot>
         <slot name="yaxis"></slot>

         <!-- main plot content -->
         <g class="axes-content" clip-path="url(#{clipPathID})">
            <slot></slot>
         </g>

         <!-- axis and box -->
         <slot name="box"></slot>

      </svg>
   </div>

   {#if !$isOk}
   <p class="message_error">
      Axes component was not properly initialized. <br />
      Add plot series (check that coordinates are numeric) or define axes limits manually.
   </p>
   {/if}

</div>

<style>

   /* Plot (main container) */
   :global(.plot) {
      font-family: Arial, Helvetica, sans-serif;

      display: grid;
      grid-template-columns: min-content auto;
      grid-template-rows: min-content auto min-content;
      grid-template-areas:
         ". title"
         "ylab axes"
         ". xlab";

      box-sizing: border-box;
      background: #fefefe;
      min-width: 100px;
      min-height: 50px;
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
   }

   :global(.plot_small) {
      font-size: 11px;
   }

   :global(.plot_medium) {
      font-size: 13px;
   }

   :global(.plot_large) {
      font-size: 16px;
   }

   :global(.plot_error) {
      display: flex;
   }

   :global(.plot_error > .axes-wrapper) {
      display: none;
   }

   :global(.message_error) {
      font-size: 1.2em;
      color: crimson;
      padding: 20px;
      text-align: center;
   }

   /* Axes (coordinate system) */
   .axes-wrapper {
      grid-area: axes;
      position:relative;
      box-sizing: border-box;
      display: flex;
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
   }

   :global(.axes) {
      display: block;
      box-sizing: border-box;
      position:absolute;

      padding: 0;
      margin: 0;
      height: 100%;
      width: 100%;
      max-height: 100%;
      max-width: 100%;
      min-height: 100%;
      min-width: 100%;
   }

   :global(.axes-content) {
      padding: 0;
      margin: 0;
      height: 100%;
      width: 100%;
      max-height: 100%;
      max-width: 100%;
      min-height: 100%;
      min-width: 100%;

   }

   :global(.axes__xlabel) {
      grid-area: xlab;
      font-size: 1.0em;
      font-weight: 600;
      padding: 0.25em;
      text-align: center;
   }


   :global(.axes__ylabel) {
      grid-area: ylab;
      font-size: 1.0em;
      font-weight: 600;
      padding: 0.25em;
      text-align: center;
      vertical-align: middle;
      display: flex;
   }

   :global(.axes__ylabel > span) {
      width: 1.5em;
      line-height: 1.5em;
      display: inline-block;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
   }


   :global(.axes__title) {
      background: transparent;
      grid-area: title;

      font-size: 1.3em;
      font-weight: bold;
      line-height: 1.2em;
      padding: 0.5em 0;
      text-align: center;
   }

   /* Axis */
   :global(.axis-labels) {
      fill: #303030;
      font-size: 0.95em;
   }

   /* Data labels */
   :global(.labels) {
      fill: #606060;
      font-size: 0.90em;
   }

   :global(.labels) {
      visibility: hidden;
      transition:visibility 0.25s linear, opacity 0.25s linear;
      opacity: 0;
   }

</style>