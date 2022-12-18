<script>
   // shared components - 3d plot elements
   import Axes from '../../shared/plots3d/Axes.svelte';
   import XAxis from '../../shared/plots3d/XAxis.svelte';
   import YAxis from '../../shared/plots3d/YAxis.svelte';
   import ZAxis from '../../shared/plots3d/ZAxis.svelte';

   export let limX;
   export let limY;
   export let limZ;

   // initial orientation
   let phi = -25.264 / 180 * Math.PI
   let theta = 215 / 180 * Math.PI;
   let zoom = 0.5;

   // drugging settings
   let isDragging = false;
   let draggingStartPosition = [];
   let plotPane;

   const zoomScene = (e) => {
      zoom = zoom + e.deltaY / 100
      if (zoom < 0.1) zoom = 0.1;
      if (zoom > 2.0) zoom = 2.0;
   }

   const startRotation = (e) => {
      draggingStartPosition = [e.clientX, e.clientY];
      isDragging = true;
   }

   const stopRotation = (e) => {
      isDragging = false;
   }

   const rotate = (e) => {
      if (!isDragging || !plotPane) return;

      // get size of plot pane and coordinates of current mouse position
      const width = plotPane.getBoundingClientRect().width;
      const height = plotPane.getBoundingClientRect().height;
      const currentPosition = [e.clientX, e.clientY];
      if (width < 100) return;

      // compute angle for horizontal rotation
      const dx = currentPosition[0] - draggingStartPosition[0];
      phi = phi + (dx / width * Math.PI)

      // compute angle for vertical rotation
      const dy = currentPosition[1] - draggingStartPosition[1];
      theta = theta + (dy / height * Math.PI)

      // update start moust position
      draggingStartPosition = currentPosition;
   }

   /* rotate and move plot by keyboard */
   document.onkeydown = function (event) {
      if (event.key == "ArrowLeft") phi = phi - 0.05;
      if (event.key == "ArrowRight") phi = phi + 0.05;
      if (event.key == "ArrowUp") theta = theta - 0.01;
      if (event.key == "ArrowDown") theta = theta + 0.01;
      if (event.key == "+") zoom = zoom * 1.1;
      if (event.key == "-") zoom = zoom * 0.9;
   }
</script>

<div  bind:this={plotPane}
      on:mousewheel={zoomScene}
      on:mousemove={rotate}
      on:mousedown={startRotation}
      on:mouseleave={stopRotation}
      on:mouseup={stopRotation}
>
   <Axes {limX} {limY} {limZ} {zoom} {phi} {theta}>
      <slot></slot>
      <XAxis showGrid={true} title="X1" slot="xaxis" />
      <YAxis showGrid={true} title="Y" slot="yaxis" />
      <ZAxis showGrid={true} title="X2" slot="zaxis" />
   </Axes>
</div>

<style>
   div {
      display: block;
      width: 100%;
      height: 100%;
   }
</style>