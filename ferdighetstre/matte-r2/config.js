'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for matematikk R2.                       */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'r2-ferdighetstre-fullfort',

  // Viser «Hvorfor skal jeg lære matte?»-knappen øverst i header (kun
  // matematikkfagene, se ferdighetstre/instruks.md).
  showMotivationButton: true,

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre. Utledet fra en
  // gjennomgang av kompetansemålene for R2 og fem eksamenssett (V24, H24,
  // V25, H25, V26). Rekker/rekursjon og trigonometri kommer først fordi de
  // brukes videre i integrasjonsteknikker og modellering. Renter og
  // annuiteter står rett etter Rekker siden annuitetsformlene bygger direkte
  // på summen av en geometrisk rekke. Vektorer i rommet står før
  // parameterframstilling siden kinematikk-delen bygger direkte på
  // vektorregningen (og på parameterframstilling av linjer). Emner i CSV-en
  // som ikke står her havner til slutt (alfabetisk).
  topicOrder: [
    'Rekker',
    'Renter og annuiteter',
    'Rekursjon og programmering',
    'Trigonometri: funksjoner og identiteter',
    'Integrasjonsteknikker',
    'Integral som grenseverdi og fundamentalteoremet',
    'Numerisk integrasjon',
    'Funksjonsdrøfting og omdreiningslegemer',
    'Modellering med funksjoner og reelle datasett',
    'Analyse av modeller med derivasjon og integrasjon',
    'Vektorer i rommet',
    'Parameterframstilling og kinematikk',
    'Matematiske bevis',
  ],

  // Kursnavnet som settes inn i den delte KI-instruksmalen
  // (se ferdighetstre/engine.js -> buildInstructionTemplate).
  courseName: 'matematikk R2 (norsk videregående skole)',

  // Fagspesifikke eksempler på formuleringsfeil KI-en skal kommentere
  // vennlig, men tydelig (satt inn i den delte malen). Handler om notasjon/
  // presisjon som ville gitt trekk på eksamen, ikke om sluttsvaret er riktig.
  formuleringsfokus: 'glemmer +C i et ubestemt integral, eller dx i selve integraluttrykket, skriver "=" der ≈ er riktig (f.eks. mellom en numerisk tilnærming og en eksakt verdi), oppgir vektorer uten pil eller uten koordinater i klammer, glemmer å oppgi enhet ved banefart/akselerasjon (f.eks. m/s eller m/s²), oppgir en parameterframstilling uten å angi hvilket intervall parameteren er gyldig for, avrunder mellomsvar for tidlig i en flertrinnsoppgave med regresjon eller numerisk løsning, eller blander sammen det bestemte og det ubestemte integralet (glemmer grensene, eller setter på en integrasjonskonstant i et bestemt integral)',

  // Hjelpemiddel-kontekst for KI-instruksen. R2 følger SAMME hjelpemiddel-
  // reform som 1P/2P/R1 fra våren 2027: del 2 skal besvares for hånd, ingen
  // datamaskin/nettbrett i det hele tatt. Kun egne notater på papir, trykte
  // hjelpemidler og en enkel vitenskapelig kalkulator (kvadratrøtter,
  // logaritmer, sin/cos/tan, standardavvik) er tillatt - grafiske,
  // likningsløsende, programmerbare eller kommunikasjonsdyktige kalkulatorer
  // er IKKE tillatt - se R2instruks.md for begrunnelse. De fem eksamenssettene
  // denne appen er bygget på (V24, H24, V25, H25 og V26) ble alle skrevet FØR
  // reformen trer i kraft og tillater derfor eksplisitt fullt
  // CAS/graftegner/datamaskin på del 2 (V25 åpner i tillegg for noen utvalgte
  // nettbaserte hjelpemidler) - det gjenspeiler ikke hjelpemiddelordningen
  // elever som bruker denne appen faktisk vil møte, og skal derfor IKKE brukes
  // som fasit for denne teksten. Del 1 er uendret av reformen (uten
  // hjelpemidler i det hele tatt, heller ikke kalkulator).
  composeHjelpemiddelContext(hjelpemiddel) {
    const felles = 'Treningen skal gjenspeile hvordan ferdigheten faktisk skal utføres på eksamen, med hjelpemiddelordningen fra våren 2027 (ingen datamaskin/nettbrett på del 2 i det hele tatt - kun en enkel vitenskapelig kalkulator, egne notater på papir og trykte hjelpemidler). Eksamen tillater uansett ikke kunstig intelligens til å generere innhold i besvarelsen - denne treningsøkten er forberedelse, ikke eksamensgjennomføring.';
    if (hjelpemiddel === 'del1') {
      return `Hjelpemidler: Dette gjelder del 1 av eksamen, helt uten hjelpemidler - ikke engang kalkulator. Forvent at eleven regner for hånd, med kun vanlige skrivesaker, passer og linjal tilgjengelig. ${felles}`;
    }
    if (hjelpemiddel === 'del2') {
      return `Hjelpemidler: Dette gjelder del 2 av eksamen, som fra våren 2027 skal besvares for hånd. Forvent at eleven bruker en enkel vitenskapelig kalkulator (kan regne med kvadratrøtter, logaritmer, sinus/cosinus/tangens og standardavvik), eventuelt egne notater eller trykte hjelpemidler. Merk: grafiske kalkulatorer og kalkulatorer som kan løse likninger, er programmerbare eller kan kommunisere med andre enheter, er IKKE tillatt - og heller ikke CAS-programvare eller PC/datamaskin (f.eks. GeoGebra). ${felles}`;
    }
    return `Hjelpemidler: Dette er relevant både uten hjelpemidler (del 1) og med en enkel vitenskapelig kalkulator (del 2, fra våren 2027 - ingen datamaskin, og heller ingen grafisk/likningsløsende/programmerbar kalkulator). Tilpass etter hvilken del eleven trener på, og spør eleven hvis det er uklart. ${felles}`;
  },
};
