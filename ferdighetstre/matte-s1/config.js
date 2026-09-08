'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for matematikk S1.                       */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 's1-ferdighetstre-fullfort',

  // Viser «Hvorfor skal jeg lære matte?»-knappen øverst i header (kun
  // matematikkfagene, se ferdighetstre/instruks.md).
  showMotivationButton: true,

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre. Utledet fra en
  // gjennomgang av kompetansemålene for S1 og to eksamenssett (H25/V26).
  // Algebraen (potenser/logaritmer) og grenseverdi-/kontinuitetsbegrepene
  // kommer først fordi derivasjon av eksponential- og logaritmeuttrykk
  // bygger på dem. Kombinatorikk er plassert før sannsynlighet fordi de
  // fleste sannsynlighetsoppgavene i S1 bruker kombinatorisk telling.
  // Emner i CSV-en som ikke står her havner til slutt (alfabetisk).
  topicOrder: [
    'Potenser og logaritmer',
    'Grenseverdier og kontinuitet',
    'Derivasjon',
    'Derivasjon: modellering og optimering',
    'Kombinatorikk',
    'Sannsynlighet',
    'Sannsynlighetsfordelinger og simulering',
  ],

  // Kursnavnet som settes inn i den delte KI-instruksmalen
  // (se ferdighetstre/engine.js -> buildInstructionTemplate).
  courseName: 'matematikk S1 (norsk videregående skole, programfag realfag)',

  // Fagspesifikke eksempler på formuleringsfeil KI-en skal kommentere
  // vennlig, men tydelig (satt inn i den delte malen). Handler om notasjon/
  // presisjon som ville gitt trekk på eksamen, ikke om sluttsvaret er riktig.
  formuleringsfokus: 'blander sammen grenseverdien til en funksjon i et punkt med funksjonsverdien i punktet (særlig ved diskontinuitet eller hull), skriver f(x) der de mener f\'(x) (eller omvendt), bruker likhetstegn feil (f.eks. kjeder sammen uttrykk med "=" som ikke faktisk er like), oppgir et kombinatorikkuttrykk (nCr, nPr, fakultet) uten å forklare hva det teller, eller skriver P(X = k) der de egentlig mener P(X ≥ k) eller omvendt',

  // Hjelpemiddel-kontekst for KI-instruksen. Merk: eksamensteksten til H25/V26
  // (kildegrunnlaget for noder.csv/eksamensoppgaver.csv) beskriver fortsatt
  // fri bruk av CAS/graftegner på del 2, fordi de settene ble skrevet før den
  // nasjonale hjelpemiddelreformen som trer i kraft fra våren 2027. Fra og
  // med da gjelder samme ordning for S1 som for 1P/2P: del 1 er som før
  // (ingen hjelpemidler), mens del 2 skal besvares for hånd - ingen
  // datamaskin/nettbrett i det hele tatt. Kun egne notater på papir, trykte
  // hjelpemidler og en enkel vitenskapelig kalkulator (kvadratrøtter,
  // logaritmer, sin/cos/tan, standardavvik) er tillatt - grafiske,
  // likningsløsende, programmerbare eller kommunikasjonsdyktige kalkulatorer
  // er IKKE tillatt. UAVKLART (spør Vidar): Udirs minstekrav til kalkulatoren
  // nevner ikke regresjon eller fordelingsfunksjoner (binomisk/hypergeometrisk
  // sannsynlighet) - hvordan noder som i utgangspunktet forutsetter et slikt
  // digitalt verktøy skal løses med kun en "enkel vitenskapelig kalkulator" på
  // del 2 er ikke avklart her, og teksten under er derfor forsiktig omskrevet
  // i påvente av en avgjørelse. Selve oppgavetekstene/nodene er fortsatt
  // gyldige som øvingsoppgaver - det er kun hvilket verktøy eleven forventes å
  // løse dem med på ordentlig eksamen, som er endret.
  composeHjelpemiddelContext(hjelpemiddel) {
    const felles = 'Treningen skal gjenspeile hvordan ferdigheten faktisk skal utføres på eksamen, med hjelpemiddelordningen fra våren 2027 (ingen datamaskin/nettbrett på del 2 i det hele tatt - kun en enkel vitenskapelig kalkulator, egne notater på papir og trykte hjelpemidler).';
    if (hjelpemiddel === 'del1') {
      return `Hjelpemidler: Dette gjelder del 1 av eksamen, uten hjelpemidler. Forvent at eleven regner for hånd, uten kalkulator. ${felles}`;
    }
    if (hjelpemiddel === 'del2') {
      return `Hjelpemidler: Dette gjelder del 2 av eksamen, som fra våren 2027 skal besvares for hånd. Forvent at eleven bruker en enkel vitenskapelig kalkulator (kan regne med kvadratrøtter, logaritmer, sinus/cosinus/tangens og standardavvik), eventuelt egne notater/trykte hjelpemidler. Merk: grafiske kalkulatorer og kalkulatorer som kan løse likninger, er programmerbare eller kan kommunisere med andre enheter, er IKKE tillatt - og heller ikke CAS-programvare eller PC/nettbrett (f.eks. GeoGebra). Der noden i utgangspunktet forutsetter et digitalt verktøy som regresjon eller en fordelingsfunksjon (f.eks. binomisk/hypergeometrisk sannsynlighet): dette går utover det en enkel vitenskapelig kalkulator er spesifisert til å klare, så la eleven regne det ut fra formel for hånd (eventuelt med kalkulatorens grunnleggende funksjoner som del av utregningen) fremfor å vise til et digitalt verktøy. ${felles}`;
    }
    return `Hjelpemidler: Dette er relevant både uten hjelpemidler (del 1) og med en enkel vitenskapelig kalkulator (del 2, fra våren 2027 - ingen datamaskin, og heller ingen grafisk/likningsløsende/programmerbar kalkulator). Tilpass etter hvilken del eleven trener på, og spør eleven hvis det er uklart. ${felles}`;
  },
};
