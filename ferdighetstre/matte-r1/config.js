'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for matematikk R1.                       */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'r1-ferdighetstre-fullfort',

  // Viser «Hvorfor skal jeg lære matte?»-knappen øverst i header (kun
  // matematikkfagene, se ferdighetstre/instruks.md).
  showMotivationButton: true,

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre. Utledet fra en
  // gjennomgang av kompetansemålene for R1 og to eksamenssett (H25/V26).
  // "Utforskende arbeid med data" (kompetansemål 1, det selvstendige
  // arbeidet med reelle datasett) står bevisst sist, som et sluttpunkt som
  // bygger på modelleringsferdighetene i eksponentiell/logistisk vekst.
  // Emner i CSV-en som ikke står her havner til slutt (alfabetisk).
  topicOrder: [
    'Potenser og logaritmer',
    'Grenseverdier og kontinuitet',
    'Derivasjon: grunnlag',
    'Funksjonsdrøfting med derivasjon',
    'Eksponentiell og logistisk vekst',
    'Omvendte funksjoner',
    'Vektorer i planet',
    'Parameterframstilling',
    'Programmering og numeriske metoder',
    'Utforskende arbeid med data',
  ],

  // Kursnavnet som settes inn i den delte KI-instruksmalen
  // (se ferdighetstre/engine.js -> buildInstructionTemplate).
  courseName: 'matematikk R1 (norsk videregående skole)',

  // Fagspesifikke eksempler på formuleringsfeil KI-en skal kommentere
  // vennlig, men tydelig (satt inn i den delte malen). Handler om notasjon/
  // presisjon som ville gitt trekk på eksamen, ikke om sluttsvaret er riktig.
  formuleringsfokus: 'blander sammen f(x) og f\'(x) (eller skriver "avledet" i stedet for riktig notasjon), bruker "=" om uttrykk som ikke faktisk er like (f.eks. mellom en tilnærming og en eksakt verdi, der ≈ er riktig), glemmer å oppgi enhet ved fart/vekstfart (f.eks. m/s eller per år), oppgir vektorer uten pil eller uten koordinater, glemmer å oppgi definisjonsmengden til en omvendt funksjon, eller avrunder mellomsvar for tidlig i en flertrinnsoppgave med eksponentiell eller logistisk modellering',

  // Hjelpemiddel-kontekst for KI-instruksen. R1 følger SAMME hjelpemiddel-
  // reform som matte-1p/matte-2p fra våren 2027: del 2 skal besvares for hånd,
  // ingen datamaskin/nettbrett i det hele tatt. Kun egne notater på papir,
  // trykte hjelpemidler og en enkel vitenskapelig kalkulator (kvadratrøtter,
  // logaritmer, sin/cos/tan, standardavvik) er tillatt - grafiske,
  // likningsløsende, programmerbare eller kommunikasjonsdyktige kalkulatorer
  // er IKKE tillatt - se R1instruks.md for begrunnelse. De to eksamenssettene
  // denne appen er bygget på (H25 og V26) ble skrevet FØR reformen trer i
  // kraft og tillater derfor eksplisitt fullt CAS/graftegner på PC på del 2 -
  // det gjenspeiler ikke hjelpemiddelordningen elever som bruker denne appen
  // faktisk vil møte, og skal derfor IKKE brukes som fasit for denne teksten.
  // Del 1 er uendret av reformen (uten hjelpemidler i det hele tatt, heller
  // ikke kalkulator).
  composeHjelpemiddelContext(hjelpemiddel) {
    const felles = 'Treningen skal gjenspeile hvordan ferdigheten faktisk skal utføres på eksamen, med hjelpemiddelordningen fra våren 2027 (ingen datamaskin/nettbrett på del 2 i det hele tatt - kun en enkel vitenskapelig kalkulator, egne notater på papir og trykte hjelpemidler). Eksamen tillater uansett ikke kunstig intelligens til å generere innhold i besvarelsen - denne treningsøkten er forberedelse, ikke eksamensgjennomføring.';
    if (hjelpemiddel === 'del1') {
      return `Hjelpemidler: Dette gjelder del 1 av eksamen, helt uten hjelpemidler - ikke engang kalkulator. Forvent at eleven regner for hånd, med kun vanlige skrivesaker, passer og linjal tilgjengelig. ${felles}`;
    }
    if (hjelpemiddel === 'del2') {
      return `Hjelpemidler: Dette gjelder del 2 av eksamen, som fra våren 2027 skal besvares for hånd. Forvent at eleven bruker en enkel vitenskapelig kalkulator (kan regne med kvadratrøtter, logaritmer, sinus/cosinus/tangens og standardavvik), eventuelt egne notater/trykte hjelpemidler. Merk: grafiske kalkulatorer og kalkulatorer som kan løse likninger, er programmerbare eller kan kommunisere med andre enheter, er IKKE tillatt - og heller ikke CAS-programvare eller PC/nettbrett (f.eks. GeoGebra). ${felles}`;
    }
    return `Hjelpemidler: Dette er relevant både uten hjelpemidler (del 1) og med en enkel vitenskapelig kalkulator (del 2, fra våren 2027 - ingen datamaskin, og heller ingen grafisk/likningsløsende/programmerbar kalkulator). Tilpass etter hvilken del eleven trener på, og spør eleven hvis det er uklart. ${felles}`;
  },
};
