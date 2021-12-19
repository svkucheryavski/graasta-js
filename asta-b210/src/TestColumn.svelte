<script>
   import { subset, tTest2 } from 'mdatools/stat';

   // shared components - plots
   import DataTable  from "../../shared/tables/DataTable.svelte";
   import CIPlot from "../../shared/plots/CIPlotSimple.svelte";
   import TTestPlot from '../../shared/plots/TTestPlot.svelte';

   // local components
   import TestColumnTable from "./TestColumnTable.svelte";

   export let labels;
   export let samples;
   export let alpha;
   export let p;

   // compute statistics, t- and p-values
   $: testRes = tTest2(samples[0], samples[1], alpha);
   $: p = testRes.pValue;

   // switch main color for plots when p < alpha
   $: mainColor = testRes.pValue < alpha ? "#ff8866" : "#66aa88";
   $: xLabel = `Expected value for m${labels[0]} – m${labels[1]}`;
</script>

<div class="test-column" class:fail={testRes.pValue < alpha}>

   <!-- table with sample values-->
   <TestColumnTable labels={subset(labels, [1,2])} samples={subset(samples, [1, 2])} />

   <!-- table with statistics-->
   <DataTable variables={[
      {label: "Effect", values: [testRes.effectObserved]},
      {label: "t-value", values: [testRes.tValue]},
      {label: "p-value", values: [testRes.pValue]}
   ]} decNum={[1, 1, 3]} horizontal={true} />

   <!-- CI plot and plot with sampling distribution and p-value area -->
   <CIPlot
      showLegend={false}
      limX={[-60, 60]}
      ci={testRes.ci}
      se={testRes.se}
      ciColor={mainColor}
      expectedEffectColor={"#202020"}
      effectObserved={testRes.effectObserved}
      effectExpected={testRes.effectExpected}
   />

   <TTestPlot {xLabel} {testRes}
      reset={true}
      clicked={0}
      showLegend={false}
      limX={[-60, 60]}
      mainColor={mainColor}
   />
</div>

<style>

   .test-column {
      height: 100%;
      display: grid;
      grid-template-areas:
         "table"
         "stat"
         "ciplot"
         "testplot";
      grid-template-rows: min-content min-content 20% 30%;
      grid-template-columns: 100%;

      background: #f0f6f0;
   }

   .test-column > :global(.datatable) {
      grid-area: stat;
      font-size: 1.15em;
      border-top: solid 5px white;
      border-bottom: solid 5px white;
   }

   .test-column > :global(.datatable  .datatable__label) {
      padding: 0.15em;
      padding-left: 1.5em;
   }

   .test-column > :global(.datatable  tr:last-of-type > .datatable__value) {
      font-weight: bold;
      color: #66aa88;
   }

   .test-column.fail > :global(.datatable  tr:last-of-type > .datatable__value) {
      font-weight: bold;
      color: #ff8866;
   }

   .test-column > :global(.datatable  .datatable__value) {
      padding: 0.25em;
      padding-right: 20px;
   }

   .test-column > :global(.plot) {
      background: transparent;
      grid-area: ciplot;
   }

   .test-column > :global(.plot:first-child) {
      grid-area: ciplot;
   }

   .test-column > :global(.plot:last-child) {
      grid-area: testplot;
   }

</style>