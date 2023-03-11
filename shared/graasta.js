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


export function formatLabels(labels) {

   if (!Array.isArray(labels)) labels = [labels];
   let labelsStr = Array(length = labels.length);


   for (let i = 0; i < labels.length; i++) {
      labelsStr[i] = `<tspan fill=${colors.plots.STAT_NAME}>${labels[i].name}:</tspan>&nbsp;<tspan>${labels[i].value}</tspan>`;
   }

   return labelsStr;
}