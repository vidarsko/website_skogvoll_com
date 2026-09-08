'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for naturfag Vg1 (studieforberedende).   */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'naturfagvg1-ferdighetstre-fullfort',

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre.
  topicOrder: [
    'Naturvitenskapelig metode',
    'Kjemiske bindinger',
    'Karbonkjemi og bærekraft',
    'Bølger og stråling',
    'Ernæring og helse',
    'Arv, evolusjon og bioteknologi',
  ],

  courseName: 'naturfag Vg1 studieforberedende (norsk videregående skole)',

  // Naturfag Vg1 har ingen skriftlig sentralgitt eksamen å kalibrere mot -
  // noen elever trekkes ut til muntlig eksamen. Kartet skjuler derfor
  // D1/D2-merking helt, se naturfag-vg1_private/naturfagvg1instruks.md.
  showHjelpemiddel: false,

  formuleringsfokus: 'blander sammen fotosyntese og celleånding, forveksler bølge og bølgelengde eller stråling og strålingskilde, bruker «teori» i dagligtale-betydning i stedet for den naturvitenskapelige betydningen, eller trekker en årsakssammenheng fra data som bare viser en sammenheng (korrelasjon)',
};
