'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for Fysikk 1.                            */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'fysikk1-ferdighetstre-fullfort',

  // Fysikk 1 har ingen skriftlig del1/del2-eksamen, så del1/del2-konseptet
  // fra matte-fagene gir ikke mening her. Se ferdighetstre/instruks.md
  // ("Fagkonfigurasjon") for hva dette slår av: D1/D2-merkelappen på noder,
  // hjelpemiddel-avsnittet i KI-instruksen/prøvegeneratoren, og Del 1/Del 2
  // i tegnforklaringen. hjelpemiddel-kolonnen i noder.csv trengs derfor ikke
  // fylles ut for dette faget.
  showHjelpemiddel: false,

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre. Følger grovt
  // rekkefølgen kompetansemålene for Fysikk 1 er formulert i: fra fagets
  // metode og verktøy, via mekanikk og termofysikk/elektrisitet, til
  // stråling/klima og kjerne-/stjernefysikk, med et avsluttende
  // samfunnsrettet emne om energi og klima.
  topicOrder: [
    'Fysikk som fag',
    'Programmering og numeriske metoder',
    'Bevegelse',
    'Krefter',
    'Mekanisk energi',
    'Bevegelsesmengde',
    'Termofysikk',
    'Elektrisitet',
    'Atommodeller',
    'Stråling og klima',
    'Kjerner og stjerner',
    'Energi, klima og samfunn',
  ],

  // Kursnavnet som settes inn i den delte KI-instruksmalen
  // (se ferdighetstre/engine.js -> buildInstructionTemplate).
  courseName: 'fysikk 1 (norsk videregående skole)',

  // Fagspesifikke eksempler på formuleringsfeil KI-en skal kommentere
  // vennlig, men tydelig (satt inn i den delte malen).
  formuleringsfokus: 'glemmer å oppgi enheter eller blander enheter (f.eks. km/h og m/s), oppgir svar med feil antall gjeldende siffer, glemmer å velge og oppgi positiv retning i oppgaver med fortegn (bevegelse, krefter), eller bruker feil eller udefinerte symboler for størrelser',
};
