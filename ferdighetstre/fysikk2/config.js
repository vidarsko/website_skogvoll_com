'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for Fysikk 2.                            */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'fysikk2-ferdighetstre-fullfort',

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre. Følger grovt
  // rekkefølgen kompetansemålene for Fysikk 2 er formulert i: fagmetode
  // (forsøk/usikkerhet, internasjonalt forskningssamarbeid) og programmering
  // først, deretter mekanikk (2D-kinematikk, krumlinjet bevegelse,
  // gravitasjon), elektromagnetisme (elektriske og magnetiske felt,
  // induksjon), moderne fysikk (spesiell og generell relativitetsteori,
  // kvantefysikk), og til sist fordypningsemnet. Emner i CSV-en som ikke
  // står her havner til slutt (alfabetisk).
  topicOrder: [
    'Fysikk som fag',
    'Programmering og numeriske metoder',
    'Kinematikk i to dimensjoner',
    'Krefter og krumlinjet bevegelse',
    'Gravitasjon',
    'Elektriske felt',
    'Magnetiske felt',
    'Elektromagnetisk induksjon',
    'Spesiell relativitetsteori',
    'Generell relativitetsteori',
    'Kvantefysikk',
    'Fordypningsemne',
  ],

  // Kursnavnet som settes inn i den delte KI-instruksmalen
  // (se ferdighetstre/engine.js -> buildInstructionTemplate).
  courseName: 'fysikk 2 (norsk videregående skole)',

  // Fagspesifikke eksempler på formuleringsfeil KI-en skal kommentere
  // vennlig, men tydelig (satt inn i den delte malen).
  formuleringsfokus: 'glemmer å oppgi enheter eller blander enheter, oppgir svar med feil antall gjeldende siffer, blander sammen absolutt og relativ usikkerhet eller runder mellomsvar for tidlig i en usikkerhetsberegning, glemmer å begrunne fortegn/retning på vektorstørrelser (krefter, felt, akselerasjon) i stedet for bare å oppgi en tallverdi, bruker "=" mellom en tilnærmet og en eksakt verdi der ≈ er riktig, eller blander sammen lignende symboler (f.eks. g for tyngdeakselerasjon og g for gravitasjonsfeltstyrke, eller v for fart og v for spenning i elektriske kretser - skriv alltid tydelig hvilken størrelse et symbol representerer)',

  // Hjelpemiddel-kontekst for KI-instruksen. Del 1 av Fysikk 2-eksamen er
  // uten hjelpemidler i det hele tatt - ikke engang kalkulator - kun
  // skrivesaker, passer, linjal, vinkelmåler og vedleggene i oppgavesettet
  // (faktavedlegg, formelvedlegg, programmeringsvedlegg). FRA VÅREN 2027
  // (samme nasjonale hjelpemiddelreform som i matematikkfagene) fjernes
  // datamaskin/nettbrett helt som hjelpemiddel også på del 2 - del 2 skal da
  // besvares for hånd, med kun egne notater på papir, trykte hjelpemidler og
  // en enkel vitenskapelig kalkulator (kvadratrøtter, logaritmer, sin/cos/tan,
  // standardavvik). Grafiske, likningsløsende, programmerbare eller
  // kommunikasjonsdyktige kalkulatorer er IKKE tillatt.
  // UAVKLART (spør Vidar): del 2 tillot tidligere lokalt installert
  // programmering og GeoGebra, og eksamenssettene denne appen er bygget på
  // (5 sett, alle FØR reformen) inneholder oppgaver som forutsetter nettopp
  // dette (f.eks. numeriske simuleringer). Med datamaskin fullstendig fjernet
  // er det uklart hvordan/om denne typen oppgaver videreføres på del 2 fra
  // våren 2027 - se fysikk2instruks.md.
  composeHjelpemiddelContext(hjelpemiddel) {
    const felles = 'Eksamen tillater uansett ikke kunstig intelligens eller chatbot som hjelpemiddel i selve eksamensgjennomføringen - denne treningsøkten er forberedelse, ikke eksamen.';
    if (hjelpemiddel === 'del1') {
      return `Hjelpemidler: Dette gjelder del 1 av eksamen, helt uten hjelpemidler - ikke engang kalkulator. Forvent at eleven regner for hånd, med kun skrivesaker, passer, linjal, vinkelmåler og de trykte vedleggene (faktavedlegg, formelvedlegg, programmeringsvedlegg) tilgjengelig. ${felles}`;
    }
    if (hjelpemiddel === 'del2') {
      return `Hjelpemidler: Dette gjelder del 2 av eksamen, som fra våren 2027 skal besvares for hånd - ingen datamaskin/nettbrett, programmering eller GeoGebra i det hele tatt. Forvent at eleven bruker en enkel vitenskapelig kalkulator (kan regne med kvadratrøtter, logaritmer, sinus/cosinus/tangens og standardavvik), egne notater på papir og trykte kilder. Grafiske kalkulatorer og kalkulatorer som kan løse likninger, er programmerbare eller kan kommunisere med andre enheter, er IKKE tillatt. Der noden i utgangspunktet forutsetter et digitalt verktøy (f.eks. numerisk simulering/programmering), er det per nå uklart hvordan dette skal løses på del 2 uten datamaskin - flagg dette til eleven fremfor å late som om kalkulatoren kan erstatte det. ${felles}`;
    }
    return `Hjelpemidler: Dette er relevant både uten hjelpemidler (del 1) og med en enkel vitenskapelig kalkulator/trykte kilder (del 2, fra våren 2027 - ingen datamaskin, programmering eller GeoGebra, og heller ingen grafisk/likningsløsende/programmerbar kalkulator). Tilpass etter hvilken del eleven trener på, og spør eleven hvis det er uklart. ${felles}`;
  },
};
