'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for matematikk 1T.                       */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: '1t-ferdighetstre-fullfort',

  // Viser «Hvorfor skal jeg lære matte?»-knappen øverst i header (kun
  // matematikkfagene, se ferdighetstre/instruks.md).
  showMotivationButton: true,

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre. Følger den
  // naturlige oppbyggingen i 1T: algebraisk grunnlag først, deretter de ulike
  // funksjonstypene, derivasjon, trigonometri, og til slutt tallfølger/
  // programmering og modellering/anvendelser som trekker på flere av de
  // andre emnene samtidig. Emner i CSV-en som ikke står her havner til slutt
  // (alfabetisk).
  topicOrder: [
    'Algebra: likninger og ulikheter',
    'Andregradsfunksjoner',
    'Polynom- og rasjonale funksjoner',
    'Potens- og eksponentialfunksjoner',
    'Derivasjon og vekstfart',
    'Trigonometri',
    'Tallfølger, mønster og programmering',
    'Modellering og anvendelser',
  ],

  // Kursnavnet som settes inn i den delte KI-instruksmalen
  // (se ferdighetstre/engine.js -> buildInstructionTemplate).
  courseName: 'matematikk 1T (norsk videregående skole)',

  // Fagspesifikke eksempler på formuleringsfeil KI-en skal kommentere
  // vennlig, men tydelig (satt inn i den delte malen). Handler om notasjon/
  // presisjon som ville gitt trekk på eksamen, ikke om sluttsvaret er riktig.
  formuleringsfokus: 'blander sammen likhetstegn og pil/derav-tegn i en utregningskjede, bytter om på definisjonsområde og verdimengde, skriver et bevis eller en utledning som bare viser ett spesialtilfelle i stedet for det generelle argumentet, glemmer å ta med alle løsninger av en likning eller ulikhet (f.eks. bare positiv rot), eller runder av mellomresultater for tidlig i en flerstegs utregning',

  // Hjelpemiddel-kontekst for KI-instruksen. Samme nasjonale hjelpemiddel-
  // reform som i matte-1p og matte-2p (se matte-2p/config.js): fra våren 2027 er
  // del 1 som før (ingen hjelpemidler), mens del 2 skal besvares for hånd -
  // ingen datamaskin/nettbrett i det hele tatt. Kun egne notater på papir,
  // trykte hjelpemidler og en enkel vitenskapelig kalkulator (kvadratrøtter,
  // logaritmer, sin/cos/tan, standardavvik) er tillatt. Grafiske,
  // likningsløsende, programmerbare eller kommunikasjonsdyktige kalkulatorer
  // er IKKE tillatt. Dette prosjektet skal kun forholde seg til den nye
  // ordningen.
  composeHjelpemiddelContext(hjelpemiddel) {
    const felles = 'Treningen skal gjenspeile hvordan ferdigheten faktisk skal utføres på eksamen, med hjelpemiddelordningen fra våren 2027 (ingen datamaskin/nettbrett på del 2 i det hele tatt - kun en enkel vitenskapelig kalkulator, egne notater på papir og trykte hjelpemidler).';
    if (hjelpemiddel === 'del1') {
      return `Hjelpemidler: Dette gjelder del 1 av eksamen, uten hjelpemidler. Forvent at eleven regner for hånd, uten kalkulator. ${felles}`;
    }
    if (hjelpemiddel === 'del2') {
      return `Hjelpemidler: Dette gjelder del 2 av eksamen, som fra våren 2027 skal besvares for hånd. Forvent at eleven bruker en enkel vitenskapelig kalkulator (kan regne med kvadratrøtter, logaritmer, sinus/cosinus/tangens og standardavvik), eventuelt egne notater/trykte hjelpemidler. Merk: grafiske kalkulatorer og kalkulatorer som kan løse likninger, er programmerbare eller kan kommunisere med andre enheter, er IKKE tillatt - og heller ikke CAS-programvare eller PC/nettbrett (f.eks. GeoGebra). ${felles}`;
    }
    return `Hjelpemidler: Dette er relevant både uten hjelpemidler (del 1) og med en enkel vitenskapelig kalkulator (del 2, fra våren 2027 - ingen datamaskin, og heller ingen grafisk/likningsløsende/programmerbar kalkulator). Tilpass etter hvilken del eleven trener på, og spør eleven hvis det er uklart. ${felles}`;
  },
};
