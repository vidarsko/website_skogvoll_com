'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for matematikk S2.                       */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 's2-ferdighetstre-fullfort',

  // Viser «Hvorfor skal jeg lære matte?»-knappen øverst i header (kun
  // matematikkfagene, se ferdighetstre/instruks.md).
  showMotivationButton: true,

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre. Utledet fra en
  // gjennomgang av kompetansemålene for S2 og to eksamenssett (H25/V26).
  // Rekker og rekursjon/programmering står først fordi flere senere emner
  // (forventningsverdi via uendelig rekke, annuitetslån) bygger på dem.
  // Integrasjonsteknikkene og det bestemte integralet/fundamentalteoremet
  // kommer før emnene som bruker dem (funksjonsdrøfting, økonomisk
  // modellering, vekstmodeller). Sannsynlighetsemnene er samlet til slutt,
  // med normalfordeling/sentralgrensesetningen som forutsetning for
  // hypotesetesting. Emner i CSV-en som ikke står her havner til slutt
  // (alfabetisk).
  topicOrder: [
    'Rekker',
    'Rekursjon og programmering',
    'Integrasjonsteknikker',
    'Det bestemte integralet og fundamentalteoremet',
    'Funksjonsdrøfting med derivasjon og integrasjon',
    'Eksponentiell og logistisk vekst',
    'Økonomisk modellering: kostnad, inntekt og grensestørrelser',
    'Sannsynlighetsfordelinger: forventningsverdi, varians og simulering',
    'Normalfordeling og sentralgrensesetningen',
    'Hypotesetesting',
  ],

  // Kursnavnet som settes inn i den delte KI-instruksmalen
  // (se ferdighetstre/engine.js -> buildInstructionTemplate).
  courseName: 'matematikk S2 (norsk videregående skole, programfag realfag)',

  // Fagspesifikke eksempler på formuleringsfeil KI-en skal kommentere
  // vennlig, men tydelig (satt inn i den delte malen). Handler om notasjon/
  // presisjon som ville gitt trekk på eksamen, ikke om sluttsvaret er riktig.
  formuleringsfokus: 'blander sammen det ubestemte og det bestemte integralet (glemmer konstanten C i et ubestemt integral, eller tar den unødvendig med i et bestemt integral), bruker "=" mellom en tilnærmet og en eksakt verdi der "≈" er riktig (typisk ved digitalt bestemte modeller), glemmer å oppgi enhet ved tolkning av en deriverte eller et integral i en praktisk modell (f.eks. kr/uke, bakterier/dag), forveksler nullhypotese og alternativ hypotese eller formulerer dem upresist, skriver P(X = k) der de egentlig mener P(X ≥ k) eller omvendt, eller oppgir en forventningsverdi/varians/rentesats uten benevning',

  // Hjelpemiddel-kontekst for KI-instruksen. Merk: eksamensteksten til H25/V26
  // (kildegrunnlaget for noder.csv/eksamensoppgaver.csv) beskriver fortsatt
  // fri bruk av CAS/graftegner/regneark/programmering på del 2, fordi begge
  // sett ble skrevet før den nasjonale hjelpemiddelreformen som trer i kraft
  // fra våren 2027. Fra og med da gjelder samme ordning for S2 som for
  // 1P/2P/S1/R1: del 1 er som før (ingen hjelpemidler), mens del 2 skal
  // besvares for hånd - ingen datamaskin/nettbrett i det hele tatt. Kun egne
  // notater på papir, trykte hjelpemidler og en enkel vitenskapelig kalkulator
  // (kvadratrøtter, logaritmer, sin/cos/tan, standardavvik) er tillatt -
  // grafiske, likningsløsende, programmerbare eller kommunikasjonsdyktige
  // kalkulatorer er IKKE tillatt.
  // UAVKLART (spør Vidar), to punkter reformen ikke sier noe om direkte:
  // (1) Udirs minstekrav til kalkulatoren nevner ikke regresjon eller
  //     fordelingsfunksjoner (binomisk/hypergeometrisk sannsynlighet) -
  //     hvordan noder som forutsetter et slikt digitalt verktøy skal løses på
  //     del 2 er uklart.
  // (2) Kompetansemål 2 («utforske rekursive sammenhenger ved å bruke
  //     programmering») krever i praksis å skrive og kjøre kode - noe som per
  //     definisjon krever en datamaskin. Med datamaskin fullstendig fjernet
  //     fra del 2 er det uklart hvordan/om dette kompetansemålet fortsatt
  //     kan eksamineres der (tidligere unntak i denne filen, der
  //     programmeringsnoder trentes med et faktisk programmeringsspråk «siden
  //     kalkulatoren ikke skal erstatte det», holder ikke lenger dersom PC
  //     er helt utelukket - se S2instruks.md).
  // Selve oppgavetekstene/nodene er fortsatt gyldige som øvingsoppgaver - det
  // er kun hvilket verktøy eleven forventes å løse dem med på ordentlig
  // eksamen, som er endret/uavklart.
  composeHjelpemiddelContext(hjelpemiddel) {
    const felles = 'Treningen skal gjenspeile hvordan ferdigheten faktisk skal utføres på eksamen, med hjelpemiddelordningen fra våren 2027 (ingen datamaskin/nettbrett på del 2 i det hele tatt - kun en enkel vitenskapelig kalkulator, egne notater på papir og trykte hjelpemidler). Eksamen tillater uansett ikke kunstig intelligens til å generere innhold i besvarelsen - denne treningsøkten er forberedelse, ikke eksamensgjennomføring.';
    if (hjelpemiddel === 'del1') {
      return `Hjelpemidler: Dette gjelder del 1 av eksamen, uten hjelpemidler. Forvent at eleven regner for hånd, uten kalkulator (men med tilgang på en oppgitt tabell for standard normalfordeling der det er relevant). ${felles}`;
    }
    if (hjelpemiddel === 'del2') {
      return `Hjelpemidler: Dette gjelder del 2 av eksamen, som fra våren 2027 skal besvares for hånd. Forvent at eleven bruker en enkel vitenskapelig kalkulator (kan regne med kvadratrøtter, logaritmer, sinus/cosinus/tangens og standardavvik), eventuelt egne notater/trykte hjelpemidler. Merk: grafiske kalkulatorer og kalkulatorer som kan løse likninger, er programmerbare eller kan kommunisere med andre enheter, er IKKE tillatt - og heller ikke CAS-programvare, regneark eller annen PC-programvare. Der noden i utgangspunktet forutsetter et digitalt verktøy som regresjon, en fordelingsfunksjon eller numerisk likningsløsning: dette går utover det en enkel vitenskapelig kalkulator er spesifisert til å klare, så la eleven regne det ut fra formel for hånd i stedet. Unntak: noder som spesifikt handler om å skrive og kjøre et program (rekursive følger, simulering) trenes fortsatt med et faktisk programmeringsspråk, siden dette er en egen kompetanse i S2 - men merk at det per nå er uklart hvordan denne kompetansen faktisk skal eksamineres på del 2 uten datamaskin tilgjengelig. ${felles}`;
    }
    return `Hjelpemidler: Dette er relevant både uten hjelpemidler (del 1) og med en enkel vitenskapelig kalkulator (del 2, fra våren 2027 - ingen datamaskin, og heller ingen grafisk/likningsløsende/programmerbar kalkulator). Tilpass etter hvilken del eleven trener på, og spør eleven hvis det er uklart. ${felles}`;
  },
};
