'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for matematikk 8. trinn.                 */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'matte8-ferdighetstre-fullfort',

  // Viser «Hvorfor skal jeg lære matte?»-knappen øverst i header (kun
  // matematikkfagene, se ferdighetstre/instruks.md).
  showMotivationButton: true,

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre.
  topicOrder: [
    'Tall og tallregning',
    'Algebra og mønstre',
    'Funksjoner',
    'Programmering',
  ],

  courseName: 'matematikk 8. trinn (norsk ungdomsskole)',

  // 8. trinn har ingen skriftlig eksamen å kalibrere mot - det er 10. trinn
  // som trekkes ut til skriftlig eksamen (MAT0015). Kartet skjuler derfor
  // D1/D2-merking helt, se matte8_private/matte8instruks.md.
  showHjelpemiddel: false,

  formuleringsfokus: 'bytter om på ledd eller regnearter uten å endre svaret riktig (f.eks. ved feil bruk av den distributive egenskapen), glemmer å vise mellomregning, eller bruker likhetstegnet feil (f.eks. til å bety "neste steg" i stedet for faktisk likhet)',
};
