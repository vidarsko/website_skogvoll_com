'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for Biologi 2.                           */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'biologi2-ferdighetstre-fullfort',

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre. Følger grovt
  // rekkefølgen kompetansemålene for Biologi 2 er formulert i: fagmetode og
  // feltarbeid først, deretter populasjonsøkologi, økosystem (energistrøm og
  // stoffkretsløp), enzymer, fotosyntese/celleånding, molekylærbiologi
  // (genuttrykk, genteknologi), genetikk (arv og variasjon), evolusjon, og
  // til sist emnet om kommersiell bruk og etikk. Emner i CSV-en som ikke
  // står her havner til slutt (alfabetisk).
  topicOrder: [
    'Fagmetode og feltarbeid',
    'Populasjonsøkologi og forvaltning',
    'Energistrøm og stoffkretsløp',
    'Enzymer',
    'Fotosyntese og celleånding',
    'Genetisk kode og genuttrykk',
    'Genteknologi',
    'Arv og variasjon',
    'Evolusjon og artsdannelse',
    'Bioteknologi: bruk og etikk',
  ],

  // Kursnavnet som settes inn i den delte KI-instruksmalen
  // (se ferdighetstre/engine.js -> buildInstructionTemplate).
  courseName: 'biologi 2 (norsk videregående skole)',

  // Fagspesifikke eksempler på formuleringsfeil KI-en skal kommentere
  // vennlig, men tydelig (satt inn i den delte malen).
  formuleringsfokus: 'blander sammen ord som ligner hverandre men betyr noe helt ulikt (f.eks. gen og allel, genotype og fenotype, transkripsjon og translasjon, mitose og meiose, art og populasjon), bruker "genene endres" eller "arvestoffet muterer" upresist der det er snakk om at en bestemt DNA-sekvens endres, skriver "prosentandel" der det egentlig menes en frekvens eller sannsynlighet (eller omvendt), oppgir et svar om dominant/recessiv arv uten å vise til et konkret krysningsskjema eller stamtre, eller bruker forkortelser (ATP, DNA, CRISPR osv.) uten å ha forklart hva de står for i teksten',

  // Hjelpemiddel-kontekst for KI-instruksen. Del 1 av Biologi 2-eksamen er
  // uten hjelpemidler i det hele tatt utover skrivesaker og linjal - ikke
  // engang kalkulator. FRA VÅREN 2027 (samme nasjonale hjelpemiddelreform som
  // i matematikkfagene og de andre realfagene) fjernes datamaskin/nettbrett
  // helt som hjelpemiddel også på del 2 - ikke bare "PC med nettilgang" som
  // tidligere anslått her, men datamaskin i det hele tatt. Del 2 skal da
  // besvares for hånd, med kun egne notater på papir, trykte hjelpemidler og
  // en enkel vitenskapelig kalkulator (kvadratrøtter, logaritmer, sin/cos/tan,
  // standardavvik). Grafiske, likningsløsende, programmerbare eller
  // kommunikasjonsdyktige kalkulatorer er IKKE tillatt.
  composeHjelpemiddelContext(hjelpemiddel) {
    const felles = 'Eksamen tillater uansett ikke kunstig intelligens eller chatbot som hjelpemiddel i selve eksamensgjennomføringen - denne treningsøkten er forberedelse, ikke eksamen.';
    if (hjelpemiddel === 'del1') {
      return `Hjelpemidler: Dette gjelder del 1 av eksamen, helt uten hjelpemidler utover skrivesaker og linjal - ikke engang kalkulator. Forvent at eleven svarer kort og presist for hånd, uten oppslagsverk eller utregningshjelp. ${felles}`;
    }
    if (hjelpemiddel === 'del2') {
      return `Hjelpemidler: Dette gjelder del 2 av eksamen, som fra våren 2027 skal besvares for hånd - ingen datamaskin/nettbrett i det hele tatt. Forvent at eleven bruker en enkel vitenskapelig kalkulator (kan regne med kvadratrøtter, logaritmer, sinus/cosinus/tangens og standardavvik), egne notater på papir og trykte kilder som lærebøker. Grafiske kalkulatorer og kalkulatorer som kan løse likninger, er programmerbare eller kan kommunisere med andre enheter, er IKKE tillatt - og heller ikke digitale kilder eller åpent internett. ${felles}`;
    }
    return `Hjelpemidler: Dette er relevant både uten hjelpemidler (del 1) og med en enkel vitenskapelig kalkulator/trykte kilder (del 2, fra våren 2027 - ingen datamaskin, og heller ingen grafisk/likningsløsende/programmerbar kalkulator). Tilpass etter hvilken del eleven trener på, og spør eleven hvis det er uklart. ${felles}`;
  },
};
