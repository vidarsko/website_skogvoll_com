'use strict';

/* ------------------------------------------------------------------ */
/* Fagspesifikk konfigurasjon for Kjemi 1.                             */
/* Lastes FØR ../engine.js — se ferdighetstre/instruks.md */
/* for hva som kan/skal settes her.                                    */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'kjemi1-ferdighetstre-fullfort',

  // Rekkefølge på emne-kolonnene i kartet, venstre til høyre. Grovt langs
  // rekkefølgen kompetansemålene for Kjemi 1 er formulert i, og langs den
  // vanlige undervisningsrekkefølgen i faget: kjemi som fag først, deretter
  // atombygning/periodesystem, kjemiske bindinger, forbindelser/navnsetting,
  // støkiometri, redoks, termokjemi, reaksjonsfart/likevekt, syrer/baser,
  // løselighet, kvantitativ analyse, organisk kjemi, og til sist grønn kjemi.
  // Emner i CSV-en som ikke står her havner til slutt (alfabetisk).
  topicOrder: [
    'Kjemi som fag',
    'Atombygning og periodesystemet',
    'Kjemiske bindinger og molekylgeometri',
    'Kjemiske forbindelser og navnsetting',
    'Støkiometri',
    'Redoksreaksjoner',
    'Termokjemi',
    'Reaksjonsfart og likevekt',
    'Syrer og baser',
    'Løselighet',
    'Kvantitativ analyse',
    'Organisk kjemi',
    'Grønn kjemi',
  ],

  // Kursnavnet som settes inn i den delte KI-instruksmalen
  // (se ferdighetstre/engine.js -> buildInstructionTemplate).
  courseName: 'kjemi 1 (norsk videregående skole)',

  // Fagspesifikke eksempler på formuleringsfeil KI-en skal kommentere
  // vennlig, men tydelig (satt inn i den delte malen).
  formuleringsfokus: 'glemmer å balansere reaksjonslikninger (inkludert ladning i redoksreaksjoner, ikke bare atomer), glemmer tilstandssymboler (s), (l), (g), (aq), blander sammen K og Ka/Kb, bruker enkeltpil (→) der likevektspil (⇌) er riktig eller omvendt, oppgir svar med feil antall gjeldende sifre eller glemmer enheter (spesielt mol/L, mol, g/mol, kJ/mol), blander sammen konsentrasjon (mol/L) og stoffmengde (mol) i en beregning, blander sammen atomnummer og massetall, eller bruker upresise dagligord (f.eks. "stoffet forsvinner" i stedet for å navngi hva det reagerer til)',

  // Kjemi 1 har ingen skriftlig eksamen med del 1/del 2 - kun muntlig
  // eksamen. Del1/del2-merkingen fra det delte rammeverket gir derfor ikke
  // mening for dette faget: skjul den helt (ingen D1/D2-merkelapp på noder,
  // intet hjelpemiddel-avsnitt i KI-instruksen eller prøvegeneratoren). Se
  // ../../ferdighetstre_private/instruks.md -> "Fagkonfigurasjon" for hva
  // dette feltet styrer.
  showHjelpemiddel: false,
};
