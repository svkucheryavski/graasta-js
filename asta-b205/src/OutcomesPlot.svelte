<script>
   import { sum, min } from 'mdatools/stat';
   import OutcomesColumn from './OutcomesColumn.svelte';

   export let sample;
   export let tail;
   export let value;

   /**
    * Compute array of all possible outcomes for given sample size.
    *
    * @param {number} n - sample size.
    *
    * @return {Array} array with 2^n outcomes.
    *
    */
   function getOutcomes(n) {
      const l = 2 ** n;
      outcomes = new Array(l);
      for (let i = 0; i < l; i++) {
         outcomes[i] = [...(i>>>0).toString(2).padStart(n, '0')].map(v => v === '1');
      }
      return outcomes;
   }

   // sample size, number of heads and tails
   $: n = sample.length;
   $: nH = sum(sample);
   $: nT = n - nH;

   // create all possible outcomes for given sample size
   $: outcomes = getOutcomes(n);

   // find extremes for head (head means true)
   // both:  H0: P(H) =  0.5
   // left:  H0: P(H) <= 0.5
   // right: H0: P(H) >= 0.5

   let outcomes1 = [], outcomes2 = [], outcomes3 = [];
   let N1 = 0, N2 = 0, N3 = 0;

   $: {
      if (tail == "left") {
         outcomes1 = outcomes.filter(v => sum(v) == nH);
         outcomes2 = outcomes.filter(v => sum(v) < nH);
         outcomes3 = outcomes.filter(v => sum(v) > nH);
      } else if (tail == "right") {
         outcomes1 = outcomes.filter(v => sum(v) == nH);
         outcomes2 = outcomes.filter(v => sum(v) > nH);
         outcomes3 = outcomes.filter(v => sum(v) < nH);
      } else {
         outcomes1 = outcomes.filter(v => sum(v) == min([nH, nT]) | (nH + nT - sum(v)) == min([nH, nT]));
         outcomes2 = outcomes.filter(v => sum(v) < min([nH, nT]) | (nH + nT - sum(v)) < min([nH, nT]));
         outcomes3 = outcomes.filter(v => !(sum(v) <= min([nH, nT]) | (nH + nT - sum(v)) <= min([nH, nT])));
      }

      N1 = outcomes1.length;
      N2 = outcomes2.length;
      N3 = outcomes3.length;
      value = [N1, N2, N3];
   }

</script>


<OutcomesColumn outcomes={outcomes2} sampSize={n} name="more extreme" />
<OutcomesColumn outcomes={outcomes1} sampSize={n} name="equally extreme" />
<OutcomesColumn outcomes={outcomes3} sampSize={n} name="less extreme" />
