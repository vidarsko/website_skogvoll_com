'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for matematikk 10. trinn.                */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'matte10-ferdighetstre-fullfort',

  // Viser «Hvorfor skal jeg lære matte?»-knappen øverst i header (kun
  // matematikkfagene, se ferdighetstre/instruks.md).
  showMotivationButton: true,

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre.
  topicOrder: [
    'Tall og algebra',
    'Ligningssett og modellering',
    'Funksjoner',
    'Personlig økonomi',
    'Statistikk og sannsynlighet',
    'Geometri',
    'Programmering',
  ],

  courseName: 'matematikk 10. trinn (norsk ungdomsskole, MAT0015)',

  // 10. trinn er det eneste trinnet i grunnskolen som kan trekkes ut til
  // sentralt gitt skriftlig eksamen (MAT0015), så D1/D2-merking vises.
  // Del 1 er uten hjelpemidler i alle kildeeksamenene. Kildeeksamenene sier
  // at del 2 tillater "alle hjelpemidler, med unntak av internett og andre
  // verktøy som tillater kommunikasjon" - altså fri bruk av PC/CAS/GeoGebra.
  // I likhet med matte-1p/2p/r1 legger dette prosjektet bevisst til grunn at
  // ungdomsskolen før eller siden får samme hjelpemiddelreform som vgs (PC/
  // nettbrett/CAS-programvare fjernet på del 2, kun håndholdt kalkulator
  // igjen) - se matte10_private/matte10instruks.md for begrunnelsen. Treningen
  // er derfor skrevet for kalkulator-basert del 2, ikke for fri PC-bruk.
  composeHjelpemiddelContext(hjelpemiddel) {
    const felles = 'Treningen skal gjenspeile hvordan ferdigheten faktisk skal utføres på eksamen, med kalkulator-basert hjelpemiddelordning (ikke fri PC-/CAS-bruk) lagt til grunn for del 2.';
    if (hjelpemiddel === 'del1') {
      return `Hjelpemidler: Dette gjelder del 1 av eksamen, uten hjelpemidler. Forvent at eleven regner for hånd, uten kalkulator. ${felles}`;
    }
    if (hjelpemiddel === 'del2') {
      return `Hjelpemidler: Dette gjelder del 2 av eksamen. Forvent at eleven bruker håndholdt (vitenskapelig) kalkulator, eventuelt egne notater/trykte hjelpemidler. En slik kalkulator kan godt ha innebygd graftegning - det er ikke i seg selv et problem. Ikke legg opp til fri bruk av PC, nettbrett eller CAS-/graftegnerprogramvare (f.eks. GeoGebra) - lag heller oppgaver som kan løses med en håndholdt kalkulator. ${felles}`;
    }
    return `Hjelpemidler: Dette er relevant både uten hjelpemidler (del 1) og med håndholdt kalkulator (del 2). Tilpass etter hvilken del eleven trener på, og spør eleven hvis det er uklart. ${felles}`;
  },

  formuleringsfokus: 'glemmer å vise mellomregning eller definere variabler før de brukes i en ligning/et ligningssett, blander sammen prosentvis endring og prosentpoeng, eller runder av for tidlig i en flerstegs beregning (f.eks. i en rente- eller vekstfaktorberegning)',
};
