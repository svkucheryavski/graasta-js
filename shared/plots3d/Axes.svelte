<script>
	import { setContext, createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
   import { mdot, transpose, eye } from 'mdatools/matrix';
   import { rep } from 'mdatools/stat';
   import { niceNum } from './Utils.js';

   /*****************************************/
   /* Input parameters                      */
   /*****************************************/

   export let limX = [undefined, undefined];    // limits for x-axis (in plot units) [min, max]
   export let limY = [undefined, undefined];    // limits for y-axis (in plot units) [min, max]
   export let limZ = [undefined, undefined];    // limits for z-axis (in plot units) [min, max]
   export let theta = 0;
   export let phi = 0;
   export let zoom = 1;


   /*****************************************/
   /* Constants                             */
   /*****************************************/

   // event dispatcher
   const dispatch = createEventDispatcher();


   // number of ticks along each axis
   const TICK_NUM = {
      "small": 5,
      "medium": 8,
      "large": 12
   };

   // margin between plot series elements and data labels
   const LABELS_MARGIN = {
      "small": 5,
      "medium": 10,
      "large": 15
   };


   // line styles for different scales and types
   const LINE_STYLES = {
      small:  ["0", "3,3", "1,1", "3,1"],
      medium: ["0", "5,5", "2,2", "5,2"],
      large:  ["0", "7,7", "3,3", "7,3"],
   }

   // constant to make clip path ID unique
   const clipPathID = "plottingArea" + Math.round(Math.random() * 10000);


   /*****************************************/
   /* Variable parameters for internal use  */
   /*****************************************/

   // bindings to plot DOM elements
   let plotElement;
   let axesElement;


   /*****************************************/
   /* Helper functions                      */
   /*****************************************/


   /** Transforms world coordinates to 2D scene pixels by applying the transformation matrix 'tM'
    *  @param {Array} coords - matrix with coordinates [X, Y, Z]
    *  @param {Array} tM - transformation matrix
    *  @returns {Array} matrix with transformed coordinates [x, y]
    */
   const world2pixels = function(coords, tM) {
      const coords2D = transpose(mdot(tM, transpose([...coords, rep(1, coords[0].length)])));
//      return [coords2D[0].map(x => Math.round(x)), coords2D[1].map(y => Math.round(y))];
      return [coords2D[0], coords2D[1]];
   }

   /** Computes nice tick values for axis
    *  @param {Array} ticks - vector with ticks if alredy available (if not, new will be computed)
    *  @param {Array} lim - vector with axis limits tickets must be computed for
    *  @param {number} maxTickNum - maximum number of ticks to compute
    *  @param {boolean} round - round or not the fractions when computing nice numbers for the ticks
    *  @returns {Array} a vector with computed tick positions
    */
   const getAxisTicks = function(ticks, lim, maxTickNum, round = true) {

      // if ticks are already provided do not recompute them
      if (ticks !== undefined) return ticks;

      // check if limits are ok
      if (!Array.isArray(lim) || lim[0] === undefined || lim[1] === undefined) return undefined;

      // get range as a nice number and compute min, max and steps for the tick sequence
      const range = niceNum(lim[1] - lim[0], round);
      const tickSpacing = niceNum(range / (maxTickNum - 1), round);
      const tickMin = Math.ceil(lim[0] / tickSpacing) * tickSpacing + tickSpacing;
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
      return ticks.filter(x => x >= lim[0] && x <= lim[1]);
   }

   /** Computes a scale level based on plot area size
    *  @param {Number} width - width of plotting area in pixels
    *  @param {Number} height - height of plotting area in pixels
    *  @returns {String} the scale level ("small", "medium" or "large")
    */
   function getScale(width, height) {
      if (height < 300.2 || width < 300.2) return "small";
      if (height < 600.2 || width < 600.2) return "medium";
      return "large";
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

   /** Adjusts limits for y-axis (e.g. when new series is added)
    *  @param {Array} newLim - vector with new limits  (two values)
    */
   const adjustZAxisLimits = function(newLim) {
      if (!limZ.some(v => v === undefined)) return;
      zLim.update(lim => adjustAxisLimits(lim, newLim));
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
      const multiSeries = true;

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

   /** Mouse click handler dispatcher
    *  @param {String} eventName - name of event
    *  @param {HTMLElement} el - DOM element which received the event
    */
   function dispatchClickEvent(eventName, el) {
      dispatch(eventName, {seriesTitle: el.parentNode.getAttribute('title'), elementID: el.dataset.id});
   }

   /*****************************************/
   /* Storage to share with children        */
   /*****************************************/

   const tM = writable(eye(4));                    // transformation matrix
   const scale = writable("medium");               // plot scale (small/medium/large)
   const xLim = writable([undefined, undefined]);  // x-axis limits in 3D (before projection)
   const yLim = writable([undefined, undefined]);  // y-axis limits in 3D (before projection)
   const zLim = writable([undefined, undefined]);  // z-axis limits in 3D (before projection)
   const width = writable(100)                     // current width of axes in pixels
   const height = writable(100)                    // current heigh of axes in pixels
   const isOk = writable(false);                   // indicator that axes works fine


   /*****************************************/
   /* Axes context                          */
   /*****************************************/

   let context = {

      // methods
      adjustXAxisLimits: adjustXAxisLimits,
      adjustYAxisLimits: adjustYAxisLimits,
      adjustZAxisLimits: adjustZAxisLimits,

      getAxisTicks: getAxisTicks,
      world2pixels: world2pixels,

      // state proporties
      scale: scale,
      tM: tM,
      isOk: isOk,
      xLim: xLim,
      yLim: yLim,
      zLim: zLim,

      // constants
      LINE_STYLES: LINE_STYLES,
      LABELS_MARGIN: LABELS_MARGIN,
      TICK_NUM: TICK_NUM
   }

	setContext('axes', context);


   /*****************************************/
   /* Reactive updates of the parameters    */
   /*****************************************/

   // projection matrix (step 1)
   $: P1 = [
         [1, 0, 0, 0],
         [0, -Math.cos(theta), Math.sin(theta), 0],
         [0, -Math.sin(theta),  -Math.cos(theta), 0],
         [0, 0, 0, 1],
   ];

   // projection matrix (step 2)
   $: P2 = [
         [ Math.cos(phi), 0, Math.sin(phi), 0],
         [0, 1, 0, 0],
         [-Math.sin(phi), 0, Math.cos(phi), 0],
         [0, 0, 0, 1]
      ];

   // matrix for projection and zooming
   // we shift [0, 1] cube to center, project, zoom, and then shift back
   $: P = mdot([[1, 0, 0, 0],[0, 1, 0, 0],[0, 0, 1, 0],[0.5, 0.5, 0.5, 1]],
            mdot([[zoom, 0, 0, 0], [0, zoom, 0, 0], [0, 0, zoom, 0], [0, 0, 0, 1]],
            mdot(P2,
               mdot(P1,
                  [[1, 0, 0, 0],[0, 1, 0, 0],[0, 0, 1, 0],[-0.5, -0.5, -0.5, 1]]
               )
            ))
         );

   // update transformation matrix if angles of the norm vectors are changed
   $: {

      if ($isOk) {

         // translate
         const T1 = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [-$xLim[0], -$yLim[0], -$zLim[0], 1]
         ];

         // scale the whole cube to [0, 1] limits
         const S1 = [
            [1 / ($xLim[1] - $xLim[0]) ,  0, 0, 0],
            [0, 1 / ($yLim[1] - $yLim[0]), 0, 0],
            [0, 0, 1 / ($zLim[1] - $zLim[0]), 0],
            [0, 0, 0, 1]
         ];


         // scale to screen coordinates
         const S2 = [
            [$width,  0, 0, 0],
            [0, $height, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
         ];

         tM.update(x => mdot(S2, mdot(P, mdot(S1, T1))));
      } else {
         tM.update(x => eye(4));
      }
   }

   // adjust axis limits
   // this is reactive in case if limX and limY are interactively changed by parent script
   $: if (!limX.some(v => v === undefined)) xLim.update(v => limX);
   $: if (!limY.some(v => v === undefined)) yLim.update(v => limY);
   $: if (!limZ.some(v => v === undefined)) zLim.update(v => limZ);


   /*****************************************/
   /* Events observers                      */
   /*****************************************/

   // observer for the plot area size — to update scale
   const ro1 = new ResizeObserver(entries => {
      for (let entry of entries) {
         const pcr = plotElement.getBoundingClientRect();
         scale.update(x => getScale(pcr.width, pcr.height));
      }
   });

   // observer for the axes area size - to update size of axes
   const ro2 = new ResizeObserver(entries => {
      for (let entry of entries) {
         const acr = axesElement.getBoundingClientRect();
         width.update(x => acr.width);
         height.update(x => acr.height);
      }
   });

   onMount(() => {
      ro1.observe(plotElement);
      ro2.observe(plotElement);
   });

   onDestroy(() => {
      ro1.unobserve(plotElement);
      ro2.unobserve(plotElement);
   })

   // check if everything is ok regadring the axis limits
   $: isOk.update(v =>
      !$yLim.some(v => v === undefined) &&
      !$xLim.some(v => v === undefined) &&
      !$zLim.some(v => v === undefined) &&
      !$yLim.some(v => isNaN(v)) &&
      !$xLim.some(v => isNaN(v)) &&
      !$zLim.some(v => isNaN(v))
   )
</script>


<div class="plot {'plot_' + $scale}"  bind:this={plotElement} class:plot_error="{!$isOk}">

   <!-- axes (coordinate system) -->
   <div class="axes-wrapper" bind:this={axesElement} >
      <slot name="title"></slot>

      <svg style="background: beige" vector-effect="non-scaling-stroke" preserveAspectRatio="none" class="axes">
         <!-- axis and box -->
         <slot name="xaxis"></slot>
         <slot name="yaxis"></slot>
         <slot name="zaxis"></slot>

         <!-- main plot content -->
         <g class="axes-content" clip-path="url(#{clipPathID})">
            <slot></slot>
         </g>

         <!-- axis and box -->
         <slot name="box"></slot>
      </svg>

      {#if !$isOk}
      <p class="message_error">
         Axes component was not properly initialized. <br />
         Add plot series (check that coordinates are numeric) or define axes limits manually.
      </p>
      {/if}
   </div>


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
      width: 100%;
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