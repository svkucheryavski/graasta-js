<script>
   import AppControl from "./AppControl.svelte";

   export let id;
   export let label;
   export let value;
   export let min;
   export let max;
   export let decNum = 1;
   export let step = (max - min) / 100;

   if (value < min || value > max) {
      throw("The value is outside of the provided range.");
   }

   let sliderElement;
   let sliderContainer;
   let isDragging = false;

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

   const stopChanging = (e) => {
      isDragging = false;
      const p = getRelativePosition(e);
      if (p < 0 || p > 1) return;
      value = min + p * (max - min);
   }

   const changing = (e) => {
      if (!isDragging) return;
      const p = getRelativePosition(e);
      if (p < 0 || p > 1) return;
      value = min + p * (max - min);
   }

   $: width = (value - min) / (max - min) * 100;

</script>

<AppControl id={id} label={label} >
   <div
      class="rangeSliderContainer"
      bind:this={sliderContainer}
      on:mousemove={changing}
      on:mouseup={stopChanging}
      on:mousedown={startChanging}>

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
      background: #c0c0c0;
      height: 1.2em;
      margin: 0;
      padding: 0;
      width: auto;

      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;

   }

   .rangeSlider {
      position: relative;
      display: inline-block;
      background: #606060;
      margin: 0;
      padding: 0;
      height: 100%;
      cursor:default;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;

   }

   .rangeSlider::after {
      position: absolute;
      display: inline-block;
      right: 0;
      content: "";
      width: 5px;
      height: 100%;
      cursor:col-resize;
   }

   .rangeSliderContainer span {
      display: inline-block;
      position: absolute;
      right: 0;
      top: 0;
      font-size: 0.85em;
      padding: 1px 5px;
      color: #e0e0e0;
      mix-blend-mode: lighten;

      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
   }

   input {
      display: none;
      width: 100%;
   }
</style>

