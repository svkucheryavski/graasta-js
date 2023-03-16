<script>
   export let popCoeffs;
   export let sampCoeffs;
</script>

<div class="eq">

   <!-- y -->
   <div class="eq_term eq_term__var"><span>y</span><span>y</span></div>
   <div class="eq_term eq_term__op"><span>=</span><span>=</span></div>

   <!-- b0 -->
   <div class="eq_term eq_term__op">
      <span></span><span></span>
   </div>
   <div class="eq_term eq_term__coeff">
      <span>{Math.abs(popCoeffs.v[0]).toFixed(2)}</span><span>{Math.abs(sampCoeffs.v[0]).toFixed(2)}</span>
   </div>
   <div class="eq_term eq_term__op">
   </div>
   <div class="eq_term eq_term__coeff'}">
   </div>

   <!-- b1 -->
   <div class="eq_term eq_term__op">
      <span>{@html popCoeffs.v[1] < 0 ? '&minus;' : '+'}</span><span>{@html sampCoeffs.v[1] < 0 ? '&minus;' : '+'}</span>
   </div>
   <div class="eq_term eq_term__coeff">
      <span>{Math.abs(popCoeffs.v[1]).toFixed(2)}</span><span>{Math.abs(sampCoeffs.v[1]).toFixed(2)}</span>
   </div>
   <div class="eq_term eq_term__op">
      <span>&times;</span><span>&times;</span>
   </div>
   <div class="eq_term eq_term__var">
      <span>x<sub>2</sub></span><span>x<sub>1</sub></span>
   </div>


   <!-- b2 -->
   <div class="eq_term eq_term__op">
      <span>{@html popCoeffs.v[2] < 0 ? '&minus;' : '+'}</span><span>{@html sampCoeffs.v[2] < 0 ? '&minus;' : '+'}</span>
   </div>
   <div class="eq_term eq_term__coeff">
      <span>{Math.abs(popCoeffs.v[2]).toFixed(2)}</span><span>{Math.abs(sampCoeffs.v[2]).toFixed(2)}</span>
   </div>
   <div class="eq_term eq_term__op">
      <span>&times;</span><span>&times;</span>
   </div>
   <div class="eq_term eq_term__var">
      <span>x<sub>2</sub></span><span>x<sub>2</sub></span>
   </div>

</div>

<style>
   .eq {
      display: flex;
      flex-direction: row;
      font-size: 1.35em;
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

   .eq_term__var{
      color: #404040;
   }

   .eq_term__coeff{
      color: #a0a0ef;
   }

   .eq_term__coeff > span:first-of-type{
      color: #808080;
   }

   .eq_term > :global(span){
      text-align: center;
      padding: 0;
      margin: 1px;
      line-break: none;
      line-height: 1.5em;
   }

   sub {
      position: relative;
      line-height:0;
      top: 0.05em;
      font-size: 0.6em;
   }


</style>