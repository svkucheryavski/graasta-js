<script>
   import { vector } from 'mdatools/arrays';


   export let pX1;
   export let pX2;
   export let coeffs;
   export let showLines = 'Both';

   $: x = vector([1, pX1, pX2, pX1 * pX2]);
   $: y = x.dot(coeffs);
</script>

<div class="eq">

   <!-- y -->
   <div class="eq_term eq_term__val"><span>{y.toFixed(2)}</span><span>y</span></div>
   <div class="eq_term eq_term__op"><span>=</span><span>=</span></div>

   <!-- b0 -->
   <div class="eq_term eq_term__op">
      <span></span><span></span>
   </div>
   <div class="eq_term eq_term__coeff" >
      <span>{coeffs.v[0].toFixed(1)}</span><span>b0</span>
   </div>

   <!-- b1 -->
   <div class="eq_term eq_term__op">
      <span>{@html coeffs.v[1] < 0 ? '&minus;' : '+'}</span><span>+</span>
   </div>
   <div class="eq_term eq_term__coeff">
      <span>{Math.abs(coeffs.v[1]).toFixed(2)}</span><span>b<sub>1</sub></span>
   </div>
   <div class="eq_term eq_term__op">
      <span>&times;</span><span>&times;</span>
   </div>
   <div class="eq_term {showLines != "X2" ? 'eq_term__val' : 'eq_term__coeff'}">
      <span>{pX1.toFixed(1)}</span><span>X<sub>1</sub></span>
   </div>

   <!-- b2 -->
   <div class="eq_term eq_term__op">
      <span>{@html coeffs.v[2] < 0 ? '&minus;' : '+'}</span><span>+</span>
   </div>
   <div class="eq_term eq_term__coeff">
      <span>{Math.abs(coeffs.v[2]).toFixed(2)}</span><span>b<sub>2</sub></span>
   </div>
   <div class="eq_term eq_term__op">
      <span>&times;</span><span>&times;</span>
   </div>
   <div class="eq_term {showLines != "X1" ? 'eq_term__val' : 'eq_term__coeff'}">
      <span>{pX2.toFixed(1)}</span><span>X<sub>2</sub></span>
   </div>

   <!-- b12 -->
   <div class="eq_term eq_term__op">
      <span>{@html coeffs.v[3] < 0 ? '&minus;' : '+'}</span><span>+</span>
   </div>
   <div class="eq_term eq_term__coeff">
      <span>{Math.abs(coeffs.v[3]).toFixed(2)}</span><span>b<sub>12</sub></span>
   </div>
   <div class="eq_term eq_term__op">
      <span>&times;</span><span>&times;</span>
   </div>
   <div class="eq_term {showLines != "X2" ? 'eq_term__val' : 'eq_term__coeff'}">
      <span>{pX1.toFixed(1)}</span><span>X<sub>1</sub></span>
   </div>
   <div class="eq_term eq_term__op">
      <span>&times;</span><span>&times;</span>
   </div>
   <div class="eq_term {showLines != "X1" ? 'eq_term__val' : 'eq_term__coeff'}">
      <span>{pX2.toFixed(1)}</span><span>X<sub>2</sub></span>
   </div>
</div>

<style>
   .eq {
      display: flex;
      flex-direction: row;
      font-size: 1.2em;
      align-items: stretch;
      justify-content: center;
      margin: 0.5em;
   }

   .eq_term{
      display: flex;
      flex-direction: column;
      text-align: right;
      margin: 1px;
   }

   .eq_term__op{
      color: #a0a0a0;
   }

   .eq_term__val{
      color: #336688;
   }

   .eq_term__coeff{
      color: #a0a0ef;
   }

   .eq_term > :global(span){
      text-align: center;
      padding: 0.15em;
      line-break: none;
   }

</style>