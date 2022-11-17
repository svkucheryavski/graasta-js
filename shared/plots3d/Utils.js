   /** Computes a nice spacing value for a given range
    *  @param {Number} localRange - a range (max - min)
    *  @param {boolean} round - round or not the fractions when computing the number
    *  @returns {Number} the computed spacing value
    */
   export function niceNum( localRange,  round) {

      const exponent = Math.floor(Math.log10(localRange));
      const fraction = localRange / Math.pow(10, exponent);
      let niceFraction;

      if (round) {
         if (fraction < 1.5)
            niceFraction = 1;
         else if (fraction < 3)
            niceFraction = 2;
         else if (fraction < 7)
            niceFraction = 5;
         else
            niceFraction = 10;
      } else {
         if (fraction <= 1)
            niceFraction = 1;
         else if (fraction <= 2)
            niceFraction = 2;
         else if (fraction <= 5)
            niceFraction = 5;
         else
            niceFraction = 10;
      }

      return niceFraction * Math.pow(10, exponent);
   }