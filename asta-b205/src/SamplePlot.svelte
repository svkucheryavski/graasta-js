<script>
   import {Axes} from 'svelte-plots-basic/2d';
   import SampleSeries from './SampleSeries.svelte';

   export let sample = [];
</script>

{#if sample.length > 0}
<Axes limX={[0, sample.length + 1]} limY={[-1, 1]} >
   <SampleSeries {sample} markerSize={sample.length === 4 ? 4 : 3} />
</Axes>
{/if}

