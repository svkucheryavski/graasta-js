# Svelte plots

## Description

`svelte-plots-basic` is a [Svelte](https://svelte.dev) component library for creating very simple 2D plots/charts. It is currently under active development and breaking changes may occur. In its current state (v. 0.1.0) it allows to create bar, scatter, area and line charts as well as any combination of the four. The charts are created using [SVG](https://en.wikipedia.org/wiki/Scalable_Vector_Graphics) and are re-scalable.

The description is not complete yet and will be updated during February-March of 2022.

## Installation

The set up process is similar to any other Svelte component library. Just use:

```
npm -i -D svelte-plots-basic
```

or, to install it with yarn:

```
yarn add -D svelte-plots-basic
```



## Quick start

It is assumed that you already know the basics of Svelte.

Just create a new Svelte app following the [quick start guide](https://svelte.dev/blog/the-easiest-way-to-get-started). Then open `App.svelte` file, delete everything and write the following code, which creates a simple bar chart:

```js
<script>
   import {Axes, BarSeries} from 'svelte-plots';

   // test data for the plot
   const years = [2010, 2020, 2030, 2040, 2050];
   const amount = [100, 200, 150, 300, -100];
</script>

<div class="plot">
   <Axes>
      <BarSeries
         title="Economy"
         showLabels="no"
         faceColor="#e0e0e0"
         edgeColor="#e0e0e0"
         labels="{years}"
         xValues="{years}"
         yValues="{amount}"
      />
   </Axes>
</div>
```

Then run `npm run dev` in terminal and open `localhost:5000` in browser. That is it.

Example below shows how to create a plot with axis, box and grid as well as how to combine several plot series together.

```js
<script>
   import {Axes, BarSeries} from 'svelte-plots';

   // test data for the plot
   const years = [2010, 2020, 2030, 2040, 2050];
   const amount = [100, 200, 150, 300, -100];
</script>

<div class="plot">
   <Axes>
      // x and y axis with automatic ticks and grid lines
      <XAxis showGrid="{true}"></XAxis>
      <YAxis showGrid="{true}"></YAxis>

      // bar, line and marker series with the same data values
      <BarSeries
         showLabels="no"
         faceColor="#eee"
         edgeColor="#eee"
         xValues="{years}"
         yValues="{amount}"
      />
      <LineSeries
         lineColor="blue"
         lineWidth="{2}"
         xValues="{years}"
         yValues="{amount}"
      />
      <ScatterSeries
         marker="✺"
         showLabels="hover"
         markerColor="blue"
         labels="{years}"
         xValues="{years}"
         yValues="{amount}"
      />

      // box around the axes
      <Box />
   </Axes>
</div>
```

## Details

The library has following components:

### Axes

`Axes` this is a main component, which is responsible for showing all other plot elements (axis, labels, titles, primitives, series, etc.). The `Axes` component must be always a parent for all other components. It has four optional parameters:

* `limX`  — vector with two values - x-axis limits (min and max) in plot units.
* `limY`  — vector with two values - y-axis limits (min and max) in plot units.
* `title` — a text to be shown as a plot title (on top of the plot).
* `xLabel` — a label for x-axis (shown under the axis).
* `yLabel` — a label for y-axis (shown on the right side of the axis).

If limits are not provided, the component will compute them automatically when/if you add one or several plot series. If you want to show axes without any series or use primitives instead, you need to provide the values for limits explicitly.

The `Axes` operates in two coordinate systems. One is related to plot units. For example if you make a scatter plot for Height vs Weight of people, then the x-units will be cm and y-units will be kg. The x-axis will be directed from left to right and y-axis from bottom to up, like in conventional plots. The component then will automatically recompute the coordinates of all plot elements from the plot units to pixels, depending on the current size of the plot shown in browser.

### XAxis and YAxis

Each component is responsible for visualization of the corresponding axis. The axis is shown in form of a line with outer ticks and related labels. Number of ticks and their values are computed automatically until you do not specify them as a component parameter. Each component has two optional parameters:

* `ticks` — vector with ticks
* `tickLabels` — vector with values to be shown as labels beside each tick
* `showGrid` — a logical parameter, which allows to show grid lines on the plot

The components must be placed in a particular slot of the parent `Axes` component.

