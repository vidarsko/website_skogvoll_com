'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for matematikk 9. trinn.                 */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'matte9-ferdighetstre-fullfort',

  // Viser «Hvorfor skal jeg lære matte?»-knappen øverst i header (kun
  // matematikkfagene, se ferdighetstre/instruks.md).
  showMotivationButton: true,

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre.
  topicOrder: [
    'Måling',
    'Geometri',
    'Statistikk og sannsynlighet',
  ],

  courseName: 'matematikk 9. trinn (norsk ungdomsskole)',

  // 9. trinn har ingen skriftlig eksamen å kalibrere mot - det er 10. trinn
  // som trekkes ut til skriftlig eksamen (MAT0015). Kartet skjuler derfor
  // D1/D2-merking helt, se matte9_private/matte9instruks.md.
  showHjelpemiddel: false,

  formuleringsfokus: 'glemmer å begrunne hvorfor to figurer er formlike eller kongruente (ikke bare påstå det), blander sammen areal og volum, eller glemmer å runde av eller oppgi riktig benevning i et praktisk svar',
};
