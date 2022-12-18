<script>
   import { createEventDispatcher } from "svelte";
   import AppControl from "./AppControl.svelte";

   export let id;
   export let label;
   export let value;
   export let min;
   export let max;
   export let decNum = 1;
   export let step = +((max - min) / 100).toFixed(4);
   export let disable = false;
   export let hidden = false;

   if (value < min || value > max) {
      throw("The value is outside of the provided range.");
   }

   const dispatch = createEventDispatcher();

   let sliderElement;
   let sliderContainer;
   let isDragging = false;

   const computeValue = (p) => {
      const tmpValue = min + p * (max - min);

      // strange construction below is needed for:
      // a. make a value fractionated according to step
      // b. get rid of small decimals added by JS due to loss of precision
      return(+(Math.round(tmpValue / step) * step).toFixed(4));
   }

   const getRelativePosition = (e) => {
      const sliderRect = sliderElement.getBoundingClientRect();
      const parentRect = sliderContainer.getBoundingClientRect();
      const minX = sliderRect.x;
      const maxX = parentRect.x + parentRect.width;

      return (e.clientX - minX) / (maxX - minX);
   }

   const startChanging = (e) => {
      const p = getRelativePosition(e);
      if (p < 0 || p > 1) return;
      isDragging = p * 100 > width - 5 && p * 100 < width + 5;
   }

   const cancelChanging = (e) => {
      isDragging = false;
   }

   const stopChanging = (e) => {
      isDragging = false;
      const p = getRelativePosition(e);
      if (p < 0 || p > 1) return;

      value = computeValue(p);
   }

   const changingByWheel = (e) => {
      let newValue = value + step * e.deltaY * 0.1;
      if (newValue < min) newValue = min;
      if (newValue > max) newValue = max;
      value = newValue;
   }

   const changing = (e) => {
      if (!isDragging) return;
      const p = getRelativePosition(e);
      if (p < 0 || p > 1) return;

      value = computeValue(p);
   }

   $: width = (value - min) / (max - min) * 100;
   $: dispatch("change", value);
</script>

<AppControl id={id} label={label} {disable} {hidden}>
   <div
      class="rangeSliderContainer"
      bind:this={sliderContainer}
      on:mousewheel|preventDefault={changingByWheel}
      on:mousemove={changing}
      on:mousedown={startChanging}
      on:mouseleave={cancelChanging}
      on:mouseup={stopChanging}>

      <div class="rangeSlider" style="width:{width}%" bind:this={sliderElement}></div>
      <span>{value.toFixed(decNum)}</span>
   </div>
   <input type="range" step={step} bind:value="{value}" min={min} max={max}>
</AppControl>

<style>
   .rangeSliderContainer {
      position: relative;
      box-sizing: border-box;
      display: inline-block;
      flex: 1 1 auto;
      background: #e0e0e0;
      height: 1.5em;
      margin: 0;
      padding: 0;
      width: auto;
      border-radius: 2px;

      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;

   }

   .rangeSlider {
      position: relative;
      display: inline-block;
      background: #606060;
      border-radius: 2px;

      margin: 0;
      padding: 0;
      height: 100%;
      cursor:default;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
   }

   .rangeSliderContainer span {
      display: inline-block;
      position: absolute;
      right: 0;
      top: 0;
      font-size: 0.85em;
      padding: 1px 5px;
      color: #606060;
      mix-blend-mode: difference;
      line-height: 1.6em;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
   }

   input {
      display: none;
      width: 100%;
   }
</style>

