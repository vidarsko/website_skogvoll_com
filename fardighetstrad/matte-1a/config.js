'use strict';

/* ------------------------------------------------------------------ */
/* Ämnesspecifik konfiguration för Matematik 1a (Gy25, yrkesprogram).  */
/* Laddas FÖRE ../engine.js (den SVENSKA motorn) - se                  */
/* ferdighetstre_private/instruks.md → "Fagkonfigurasjon" för vad    */
/* som kan/ska sättas här (samma kontrakt som den norska motorn).      */
/* ------------------------------------------------------------------ */

window.FT_CONFIG = {
  storageKey: 'matte1a-sv-fardighetstre-fullfort',

  // Visar «Varför ska jag lära mig matte?»-knappen högst upp i headern
  // (samma mönster som de norska matematikämnena).
  showMotivationButton: true,

  // Matematik 1a har inget bekräftat nationellt prov med en del1/del2-
  // liknande hjälpmedelsuppdelning att kalibrera mot ännu - döljer därför
  // D1/D2-märkningen helt, se matte-1a_private/matte1ainstruks.md.
  showHjelpemiddel: false,

  // Ordning på ämnesspalterna i kartan, vänster till höger. Ämnen som finns
  // i noder.csv men inte i denna listan hamnar sist (alfabetiskt).
  topicOrder: [
    'Aritmetik och procent',
    'Geometri och skala',
    'Algebra och funktioner',
    'Ekonomi och digitala verktyg',
    'Sannolikhet och statistik',
    'Problemlösning och modeller',
  ],

  // Kursnamnet som sätts in i den delade AI-instruktionsmallen
  // (se ../engine.js -> buildInstructionTemplate).
  courseName: 'matematik 1a (svenskt gymnasium, yrkesprogram, Gy25)',

  // Ämnesspecifika exempel på formuleringsfel AI:n ska kommentera vänligt,
  // men tydligt (sätts in i den delade mallen).
  formuleringsfokus: 'glömmer enhet eller %-tecken, blandar ihop area och omkrets, avrundar för tidigt eller onoggrant, eller använder likhetstecknet fel (t.ex. kedjar samman uttryck med "=" som inte faktiskt är lika, eller använder "=" för att betyda "nästa steg" istället för likhet)',
};
