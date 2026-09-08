'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for samfunnskunnskap Vg1 (fellesfag).    */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'samfunnskunnskapvg1-ferdighetstre-fullfort',

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre.
  topicOrder: [
    'Samfunnsfaglig metode og kildekritikk',
    'Demokrati og medborgerskap',
    'Politikk og makt',
    'Identitet og sosialisering',
    'Mangfold og ulikhet',
    'Arbeidsliv og samfunnsmodellen',
    'Personlig økonomi og forbruk',
    'Samfunnsøkonomi og bærekraft',
    'Internasjonale forhold',
  ],

  courseName: 'samfunnskunnskap Vg1 (norsk videregående skole)',

  // Samfunnskunnskap Vg1 har ingen skriftlig sentralgitt eksamen å
  // kalibrere mot - noen elever trekkes ut til muntlig eksamen. Kartet
  // skjuler derfor D1/D2-merking helt, se
  // samfunnskunnskap-vg1_private/samfunnskunnskapvg1instruks.md.
  showHjelpemiddel: false,

  formuleringsfokus: 'bruker «teori» eller «ideologi» i dagligtale-betydning i stedet for presist, forveksler skatt og avgift, blander sammen levestandard og livskvalitet, eller trekker en konklusjon («drøfter») uten å faktisk veie argumenter mot hverandre først',
};
