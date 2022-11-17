<script>
   import Axes from '../../shared/plots3d/Axes.svelte';
   import XAxis from '../../shared/plots3d/XAxis.svelte';
   import YAxis from '../../shared/plots3d/YAxis.svelte';
   import ZAxis from '../../shared/plots3d/ZAxis.svelte';
   import Segments from '../../shared/plots3d/Segments.svelte';
   import ScatterSeries from '../../shared/plots3d/ScatterSeries.svelte';

   import {expandGrid, rep, seq} from 'mdatools/stat';
   import { mdot, transpose, matrix, vmult, mmult } from 'mdatools/matrix';

   const b = [[1, 0, 0, 0]];

   const X11 = seq(1, 5);
   const X12 = [1, 5];

   const X1Start = [rep(1, X11.length), X11, rep(-5, X11.length), vmult(X11, -5)];
   const Y1Start = mdot(X1Start, b);

   const X1End = [rep(1, X11.length), X11, rep(5, X11.length), vmult(X11, 5)];
   const Y1End = mdot(X1End, b);

   let pX = 2;
   let pZ = 2;
   let pY = mdot([[1], [pX], [pZ], [pX * pZ]], b);

   let phi = 0;
   let theta = 0;
   let zoom = 0.85;

   document.onkeydown = function (event) {
      if (event.key == "ArrowLeft") phi = phi - 0.05;
      if (event.key == "ArrowRight") phi = phi + 0.05;
      if (event.key == "ArrowUp") theta = theta - 0.01;
      if (event.key == "ArrowDown") theta = theta + 0.01;
      if (event.key == "+") zoom = zoom * 1.1;
      if (event.key == "-") zoom = zoom * 0.9;
   }
</script>

<div class="plot-container">
   <Axes limY={[0, 5]} limZ={[0, 5]} {zoom} {phi} {theta}>
   <!-- <Axes {zoom} {phi} {theta}> -->
      <Segments
         xStart={X1Start[1]} zStart={X1Start[2]} yStart={Y1Start[0]}
         xEnd={X1End[1]} zEnd={X1End[2]} yEnd={Y1End[0]}
         lineColor={"#4466ff60"}
      />
      <ScatterSeries xValues={[pX]} yValues={[pY]} zValues={[pZ]} />
      <ScatterSeries xValues={[pX]} yValues={[0]} zValues={[pZ]} />
      <Segments
         xStart={[pX]} zStart={[0]} yStart={[0]}
         xEnd={[pX]} zEnd={[pZ]} yEnd={[0]}
         lineColor={"#4466ff60"}
      />
      <XAxis showGrid={true} title="X1" slot="xaxis" />
      <YAxis showGrid={true} title="Y" slot="yaxis" />
      <ZAxis showGrid={true} title="X2" slot="zaxis" />
   </Axes>
</div>


