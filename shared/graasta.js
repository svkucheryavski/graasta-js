import { index, Index } from 'mdatools/arrays';

export let colors = {
   plots: {
      // population colors
      POPULATIONS_PALE: ['#33668820', '#ff990020'],
      POPULATIONS: ['#33668850', '#ff990050'],
      SAMPLES: ['#336688', '#ff9900'],

      // statistics on plot legend
      STAT_NAME: '#808080',
      STAT_VALUE: '#202020'
   }
};

/**
 * Format plot labels with correct colors, etc.
 *
 * @param {Array} labels array with labels objects ({name, value}).
 *
 * @returns {string} string with formatted SVG chunk.
 */
export function formatLabels(labels) {

   if (!Array.isArray(labels)) labels = [labels];
   let labelsStr = Array(length = labels.length);


   for (let i = 0; i < labels.length; i++) {
      labelsStr[i] = `<tspan fill=${colors.plots.STAT_NAME}>${labels[i].name}:</tspan>&nbsp;<tspan>${labels[i].value}</tspan>`;
   }

   return labelsStr;
}


/**
 * Find indices of points which contribute negatively, positively and neutrally to the covariance.
 *
 * @param {Vector} x - vector with x-values.
 * @param {number} mx - mean of the x-values.
 * @param {Vector} y - vector with y-values.
 * @param {number} my - mean of the y-values.
 *
 * @returns {Array} array with three index vectors (for positive, negative and neutral contributors).
 */
export function getIndices(x, mx, y, my) {
   const n = x.length;
   const indPos = Index.ones(n);
   const indNeg = Index.ones(n);
   const indNeu = Index.ones(n);

   let nips = 0, ning = 0, nint = 0;
   for (let i = 0; i < n; i++) {
      const p = (x.v[i] - mx) * (y.v[i] - my);
      if (p > 0) {
         indPos.v[nips] = i + 1;
         nips = nips + 1;
      } else if (p < 0) {
         indNeg.v[ning] = i + 1;
         ning = ning + 1;
      } else {
         indNeu.v[nint] = i + 1;
         nint = nint + 1;
      }
   }

   return [
      nips > 0 ? indPos.slice(1, nips) : index([]),
      ning > 0 ? indNeg.slice(1, ning) : index([]),
      nint > 0 ? indNeu.slice(1, nint) : index([])
   ];
}

/**
 * Create a string with model information
 * @param {Object} m - JSON with polynomial regression model.
 * @param {string} name - name of the model.
 * @param {string} color - color to show the model equation with.
 *
 * @returns {string} string with model info as SVG chunk.
 */
export function getModelString(m, name, color) {
   let str = '<tspan>y = </tspan>';
   for (let i = 0; i < m.coeffs.estimate.length; i++) {
      const b = m.coeffs.estimate.v[i];
      str +=
         (i > 0 ? b < 0 ? '<tspan> – </tspan>' : '<tspan> ＋ </tspan>' : '') +
         `<tspan fill="${color}" font-weight=bold>${Math.abs(b).toFixed(2)}</tspan>` +
         (i > 0 ? '<tspan font-weight=bold>x</tspan>' : '') +
         (i > 1 ? '<tspan font-size="70%" baseline-shift = "super">' + i + '</tspan>' : '')
   }
   return [`<tspan font-weight=bold>${name}</tspan>`, str];
}


/**
 * Create array with main statistics of regression model (se and R2).
 *
 * @param {Object} s - JSON with model statistics.
 *
 * @returns {Array} array with two strings.
 *
 */
export function getStatString(s) {
   return [
   `s(e) =  <tspan font-weight=bold>${s.se.toFixed(2)}</tspan>`,
   `R2 =  <tspan font-weight=bold>${s.R2.toFixed(3)}</tspan>`];
}
