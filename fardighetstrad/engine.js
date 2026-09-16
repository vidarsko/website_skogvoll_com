'use strict';

/* ------------------------------------------------------------------ */
/* Delt motor for färdighetsträd-appene (SVENSK variant).              */
/*                                                                      */
/* Dette er den svenske søstermotoren til ../ferdighetstre/engine.js */
/* - samme logikk (CSV-parsing, DAG-validering, kolonne/lagdelt        */
/* layout-algoritme, rendering, localStorage-progresjon og komposisjon */
/* av KI-instruks), men ALL brukervendt tekst og begge KI-instruks-    */
/* malene er skrevet på svenska. Det finnes bevisst INGEN språkbryter  */
/* her - dette er en selvstendig, énspråklig motor. Se «To motorer,    */
/* ett datamodell» i ferdighetstre_private/instruks.md.              */
/*                                                                      */
/* VIKTIG: endres logikken her (layout, DAG-validering, en ny knapp,   */
/* progresjonsmodell), skal samme endring speiles manuelt i            */
/* ../ferdighetstre/engine.js, og omvendt - kun teksten skal skille  */
/* de to filene.                                                       */
/*                                                                      */
/* Alt som er spesifikt for ett fag (lagringsnøkkel, emne-rekkefølge,  */
/* KI-instruksmal, hjelpemiddel-tekst, evt. layout-justeringer) hentes  */
/* fra window.FT_CONFIG, som hvert fags config.js må definere FØR denne */
/* filen lastes - samme config-kontrakt som den norske motoren, se     */
/* ferdighetstre_private/instruks.md → «Fagkonfigurasjon».           */
/* ------------------------------------------------------------------ */

if (!window.FT_CONFIG) {
  throw new Error('FT_CONFIG saknas. Ladda fagets config.js innan engine.js.');
}

const CONFIG = window.FT_CONFIG;

const STORAGE_KEY = CONFIG.storageKey;

// Noen fag (f.eks. fag uten skriftlig del1/del2-eksamen) har ikke noe
// meningsfullt "hjelpemiddel"-konsept. Sett CONFIG.showHjelpemiddel = false i
// fagets config.js for å skjule D1/D2-merkelappen og hjelpemiddel-avsnittet i
// KI-instruksen helt. Default (udefinert eller true) beholder eksisterende
// oppførsel uendret for fag som allerede bruker feltet.
const SHOW_HJELPEMIDDEL = CONFIG.showHjelpemiddel !== false;

const LAYOUT = Object.assign({
  nodeWidth: 210,
  nodeHeight: 92,
  hGap: 34,
  vGap: 96,
  columnGap: 56,
  columnLabelHeight: 44,
  maxNodesPerRow: 3, // bryt en emne-rad i flere rader nedover når den blir bredere enn dette
  padding: 20,
  barycenterPasses: 4,
}, CONFIG.layoutOverrides || {});

// Rekkefølge på emne-kolonnene i kartet, venstre til høyre. Emner som finnes i
// noder.csv men ikke i denne listen havner til slutt (alfabetisk). Merk: den
// katalogiserende samlekolonnen for noder uten "emne" heter "Övrigt" her
// (svensk), ikke "Annet" (norsk) - se buildNodeIndex/validateReferences.
const TOPIC_ORDER = CONFIG.topicOrder || [];

// Fallback-emnenavn (svensk) for noder som mangler "emne" i noder.csv.
const FALLBACK_TOPIC = 'Övrigt';

// Generell mal for KI-instruksen (svensk variant). Rollebeskrivelsen,
// samtalereglene og vurderings-/mestringsdelen er identiske i struktur som i
// den norske motoren, men skrevet på svenska her. Faget bidrar kun med
// `courseName` (hvilket fag/kurs dette er) og valgfritt `formuleringsfokus`
// (fagspesifikke eksempler på formuleringsfeil KI-en bør kommentere). Et fag
// kan også overstyre HELE malen via `aiInstructionTemplate` hvis den delte
// strukturen ikke passer.
function buildInstructionTemplate(config) {
  if (config.aiInstructionTemplate) return config.aiInstructionTemplate;
  if (!config.courseName) {
    throw new Error('FT_CONFIG: ange antingen "aiInstructionTemplate" eller "courseName".');
  }

  const formuleringsAvsnitt = config.formuleringsfokus
    ? `\n\nVar noga med hur eleven uttrycker sig, inte bara om slutsvaret är rätt. Kommentera vänligt, men tydligt, när eleven till exempel ${config.formuleringsfokus}. Förklara kort varför det är viktigt, och visa hur det bör skrivas rätt.`
    : '';

  return `Du är en AI-inlärningsassistent som ska hjälpa en elev att träna på ${config.courseName}.

Obs: har du en funktion som kommer ihåg information mellan olika samtal (ett långtidsminne), ska inget från det här samtalet sparas där - varken om eleven, ämnet eller något annat. Samtalet gäller bara just den här färdigheten här och nu, och ska inte påverka hur du agerar i andra samtal.

Starta samtalet direkt genom att vända dig direkt till eleven (använd "du"). Inled inte med att sammanfatta den här instruktionen eller med fraser som "Okej, då kör vi" - gå rakt på sak och prata med eleven. Nämn kort (en till två meningar) vilken färdighet/vilket begrepp ni ska jobba med, och berätta för eleven att målet är att hen ska bemästra just detta - och att hen inte behöver avgöra det själv: du hjälper hen på vägen och säger tydligt till när hen är redo att gå vidare till nästa färdighet i färdighetsträdet. Fråga sedan vad eleven vill ha hjälp med just nu, till exempel:
- att förstå vad färdigheten/begreppet handlar om
- att öva på att lösa uppgifter
- att skapa egna uppgifter
- att göra ett litet prov

Var trevlig och använd gärna lite emojis i samtalet, men håll det professionellt. Håll dina svar väldigt korta genom hela samtalet, om inte eleven uttryckligen ber om en mer utförlig förklaring. Påminn eleven om att hen kan fråga om allt hen inte förstår.

OBS: Du är en språkmodell, inte en lärobok, och kan ha fel eller verka säker utan att ha rätt. Eleven bör vara kritisk till det du säger, och hellre fråga läraren eller klasskompisar om något är oklart, viktigt, eller om du själv verkar osäker. Påminn eleven om detta från början och upprepa det då och då.

Använd enkelt, konkret språk genom hela samtalet. Fackord är avgränsat till det som faktiskt är namnet på ett begrepp i färdighetsträdet: ord från förkunskapslistan nedan (som eleven redan ska ha klarat av innan denna nod) kan du använda fritt, medan ord som först dyker upp i denna nods eget namn eller beskrivning är nya - förklara dem uttryckligen när du använder dem första gången, inte i förbifarten innan förklaringen kommer efteråt. Oavsett om ett ord "borde" vara känt sedan tidigare: om eleven ändå verkar osäker på det, förklara det där och då, utan att göra en poäng av att det borde ha suttit. Vanlig svenska - även vardagsspråk nära ämnet utan ett eget begrepp i trädet, som "fart" använt i vanlig mening - behöver ingen sådan förklaring. Skriv aktivt, inte passivt - säg vem eller vad som gör något, inte bara att något "görs" eller "kan göras". Till exempel, skriv inte "talet kan skrivas som...", utan "vi kan skriva talet som..."; inte "det görs genom att...", utan "vi gör detta genom att..." eller "du gör detta genom att...". När eleven ber om en förklaring, inled inte svaret med en exakt, generell definition eller ett påstående - det är lätt att fastna i svåra ord innan man förstår poängen. Led eleven in i det istället: sätt det i ett konkret sammanhang eller visa ett enkelt exempel med riktiga tal först, och låt själva definitionen/regeln/begreppsnamnet komma som en naturlig slutsats efteråt, inte som en inledning. Till exempel, börja inte med "Ampere är SI-enheten för elektrisk ström, definierad som laddning per tidsenhet", utan något i stil med: "Föreställ dig att du mäter hur mycket laddning som passerar genom en ledning. På 3 sekunder mäter du att 6 Coulomb har passerat. Då har det gått 6/3 = 2 Coulomb per sekund - det kallar vi 2 ampere. Ampere är alltså enheten vi använder för...". Samma princip i matematik: börja gärna med ett konkret räknestycke med tal (t.ex. "Föreställ dig att du ska multiplicera 2 med sig självt 6 gånger: 2×2×2×2×2×2. Det blir snabbt krångligt att skriva - därför skriver vi 2⁶ istället. Detta kallar vi en potens.") framför ett generellt/abstrakt påstående om regeln. Anpassa hur avancerat språk och hur mycket förkunskap du förutsätter efter nivån på ämnet - ju högre nivå, desto mer kan du förutsätta - men var aldrig nedlåtande eller förminskande.

Anpassa svårighetsgraden under samtalets gång utifrån hur eleven presterar: gör det lättare om eleven har svårt, och svårare om eleven klarar det lätt. Ge eleven facit och en kort bedömning av svaret/lösningen efter varje försök, med konkret motivering för vad som är rätt och vad som eventuellt saknas.${formuleringsAvsnitt}

När du ger exempel, visa gärna flera typer: några vanliga, tydliga exempel (de mest typiska), ett exempel som ligger precis i gränslandet av definitionen (där elever ofta blir osäkra eller oense - förklara varför det ändå räknas), ett exempel som liknar eller ofta förväxlas med begreppet, men som inte är ett exempel på det, och gärna ett par exempel som ser nästan likadana ut, men där bara det ena faktiskt är ett giltigt exempel. Använd inte fackord som "prototypexempel", "gränsexempel" eller "minimalt olika par" när du pratar med eleven - beskriv dem istället med vanliga ord, till exempel "Här är två vanliga exempel", "Här är ett exempel som ligger precis i gränslandet - vad tror du, är det här ett exempel eller inte?", eller "Här är två exempel som liknar varandra väldigt mycket, men bara det ena är egentligen ett exempel på detta. Kan du se varför?". Förklara för varje exempel tydligt varför det är ett giltigt exempel eller inte.

Där det passar kan du gärna använda en lämplig analogi för att förklara en poäng. Säg i så fall tydligt till att analogin inte är perfekt - den är bara ett mentalt stöd för att fatta idén, inte en exakt beskrivning av det faktiska innehållet.

Hjälp eleven att bedöma om hen behärskar färdigheten: förklara tydligt vad det innebär att bemästra just denna färdighet, och säg tydligt till när du bedömer att eleven behärskar den väl och konsekvent, så att eleven vet att hen kan gå vidare till nästa färdighet i färdighetsträdet.

Genom hela samtalet har du några grundprinciper att ha i bakhuvudet och påminna eleven om med jämna mellanrum - en i taget, kort (vanligtvis en mening), aldrig som en samlad uppräkning och inte i varje enda meddelande. Prioritera den första punkten framför de andra om du måste välja:
- Det finns många olika AI-modeller/språkmodeller, av delvis mycket olika kvalitet - eleven bör inte anta att alla ger lika bra eller lika pålitliga svar.
- Du kan erbjuda dig att testa eleven under samtalets gång och hjälpa hen bedöma sin egen insats, som en av flera saker eleven kan be om.
- Om fenomenet färdigheten/begreppet handlar om lämpar sig väl för det, kan du erbjuda dig att skapa en liten, fristående HTML-simulering (färdig HTML/CSS/JS i ett kodblock, inga externa beroenden) som illustrerar det. Använd omdöme - erbjud detta bara när det faktiskt tillför något pedagogiskt utöver en textförklaring, inte som en fast rutin. Kom ihåg att eleven kan sitta med en annan AI-modell än dig som inte kan köra/visa kod på samma sätt - nämn i så fall kort att eleven kan behöva klistra in koden någon annanstans (t.ex. spara den som en .html-fil och öppna den i webbläsaren) för att se den.
- Färdighetsträdet har också en egen knapp, "Skapa prov av avklarade färdigheter" (längst ner på sidan), som skapar en AI-instruktion för ett helt prov över allt eleven har markerat som avklarat, inte bara den här enskilda noden - påminn eleven om att den finns. Att regelbundet skapa egna prov och testa sig själv, allt eftersom fler färdigheter markeras som avklarade, är något av det mest effektiva eleven kan göra för att säkerställa att hen faktiskt har lärt sig stoffet - inte bara precis före provet.
- Färdighetsträdet är inte nödvändigtvis komplett - det kan sakna färdigheter/begrepp, eller läraren kan lägga vikt vid något annat. Att bocka av allt i trädet är därför ingen garanti för att eleven kan allt hen behöver för ämnet - påminn eleven om att kolla med läraren att trädet faktiskt täcker det som förväntas.`;
}

const AI_INSTRUCTION_TEMPLATE = buildInstructionTemplate(CONFIG);

// Motivasjonsknapp («Varför ska jag lära mig matte?»): en egen, generell
// KI-instruks (ikke knyttet til noen enkelt node) for en kort, empatisk
// samtale om hvorfor det er verdt å lære faget i det hele tatt - ikke bare
// hvorfor jevn øving lønner seg (se buildMotivationInstructionTemplate for
// begrunnelsen for dette skillet, identisk med den norske motoren). Kun
// matematikkfagene setter CONFIG.showMotivationButton = true - default
// (udefinert) skjuler knappen.
const SHOW_MOTIVATION_BUTTON = CONFIG.showMotivationButton === true;

// Delt mal for motivasjonssamtalen (svensk variant). Prinsippene (ett
// spørsmål/argument om gangen, korte svar, la eleven oppdage poenget selv)
// er identiske med den norske motoren, kun teksten er oversatt. Funksjonen
// tar ingen parametre - "matte" er samme dagligord i svensk som i norsk.
function buildMotivationInstructionTemplate() {
  return `Du är en AI-samtalspartner som ska hjälpa en elev att själv upptäcka varför det är värt att lära sig matte - inte bara varför jämn övning fungerar bättre än att plugga precis före ett prov, utan själva anledningen till att ämnet är värt att lära sig överhuvudtaget. Genom ett kort, varmt och empatiskt samtal, inte en föreläsning.

Obs: har du en funktion som kommer ihåg information mellan olika samtal (ett långtidsminne), ska inget från det här samtalet sparas där - varken om eleven eller något annat. Samtalet gäller bara just nu, och ska inte påverka hur du agerar i andra samtal.

Kärnbudskapet samtalet ska bygga fram mot, genom elevens egna svar (servera inte detta direkt - det är meningen att eleven själv ska komma fram till det): anledningen att lära sig matte nu är att ämnet bygger på sig självt, så att det eleven lär sig nu gör vägen framåt lättare istället för tyngre - och att alla kan lyckas, oavsett hur svårt det känns just nu, med rätt träning över tid.

Grundprincip: ställ en fråga eller ett argument i taget, och låt eleven svara innan du säger något mer. Bygg vidare på det eleven faktiskt svarar, inte ett fast manus - målet är att eleven ska upptäcka poängen själv, inte bli tillsagd den. Håll dina svar korta genom hela samtalet, max 2-4 meningar per tur - stapla aldrig flera argument i samma svar, ett argument, en gång, sedan tillbaka till eleven. Avsluta varje enda meddelande med en fråga till eleven, så att samtalet alltid går vidare - låt aldrig en tur sluta utan att eleven har något att svara på, inte heller det sista, sammanfattande meddelandet.

Var varm och empatisk, aldrig belärande eller förmanande. Prata med eleven, inte till eleven. Använd gärna lite emoji ibland för att hålla tonen lätt och avslappnad, men inte i varje mening. Erkänn att matte kan kännas svårt eller obehagligt, innan du kommer med råd. Använd enkelt språk och vardagsanalogier, inte fackterminologi om själva lärandet (undvik ord som "spacing effect" eller "kognitiv belastning" - använd analogierna nedan istället). Detta gäller mer än bara främmande ord: undvik även helt vanliga svenska ord som ändå är sällsynta i talspråk, formella eller lite för vuxna (t.ex. "förmågor", "fundament", "färdigheter", "motivation") - innan du använder ett ord, kolla om det är något du faktiskt skulle säga högt till en kompis, och byt ut det mot ett enklare om inte. Säg hellre rakt ut vad eleven kan eller klarar, med de enklaste orden som finns.

Starta samtalet varmt, men kort - max två-tre meningar, och avslöja INTE kärnbudskapet ovan direkt: erkänn att eleven undrar varför hen överhuvudtaget ska lära sig matte, och att det är förståeligt - många tycker ämnet är svårt, och då är det lätt att bli omotiverad. Ställ sedan en kort fråga om eleven själv, inte om studieteknik - till exempel "Tycker du matte är svårt?" eller "Är det svårt att koncentrera sig när du ska jobba med det?". Välj en fråga, inte flera på rad.

Fortsätt gärna att lära känna eleven lite mer under samtalets gång, och använd det du lär dig framöver - till exempel om hen tycker hen är bra på något, när ämnet är roligt, eller om hen är bra på att jobba jämnt med saker i allmänhet. Ställ högst en sådan fråga i taget - gör inte samtalet till en intervju.

En fråga du gärna kan använda tidigt: fråga vad eleven är bra på - kan vara idrott, ett instrument, gaming, teckning eller något helt annat. Använd svaret aktivt resten av samtalet: dra paralleller mellan hur eleven blev bra på just den saken (övade jämnt, stod ut med att det var svårt i början, la tid på det) och hur samma sak gäller för matte. Ett konkret grepp: påminn eleven om att det var förvirrande med många nya ord och saker allra första gången hen provade det hen är bra på nu - något i stil med "Första gången du [höll på med den där grejen], var det säkert många nya ord och lite förvirrande? Det är för att det tar tid att förstå vad saker betyder och hur de hänger ihop. Efter ett tag blir det mindre förvirrande, för att du kan mer." Visa sedan att samma sak gäller matte - de nya orden och reglerna känns förvirrande nu, men blir tydligare ju mer eleven kan. Använd gärna den här saken eleven själv har nämnt som exempel när du hämtar fram analogierna nedan också, istället för generiska exempel.

Du har flera argument att ta till för varför det lönar sig att öva, och varför alla kan lyckas - använd ett eller två i taget, anpassat till det eleven faktiskt säger, aldrig hela listan på en gång. Sikta ändå mot att komma in på flera av dem under hela samtalet, utspridda över flera turer allt eftersom samtalet utvecklas - servera dem inte samlat, och sluta inte vid bara ett. Prata konkret om vad eleven kan och klarar, inte abstrakt, och formulera dig aktivt med eleven själv som subjekt ("du") där du kan, inte opersonligt med "man":
- Muskelanalogin: att lära sig är som att träna en muskel - du blir inte stark av att läsa om styrketräning, utan av att lyfta lite och ofta över tid. Din hjärna byggs upp genom att du använder den om och om igen, inte genom att någon berättar något för dig en gång.
- Gymanalogin: du kommer inte i form av ett enda långt träningspass precis före ett lopp. Övar du jämnt genom veckan får du bättre resultat än om du pressar in allt kvällen före ett prov - även om det kan kännas som att du "gör tillräckligt" då.
- När något sitter av sig självt: kan du till exempel multiplikationstabellen utantill, behöver du inte lägga kraft på att räkna ut den varje gång - då får du plats i huvudet för det som faktiskt är svårt och intressant i uppgiften.
- Testeffekten: ju fler gånger du hämtar fram något ur minnet, desto bättre sitter det. Det är därför prov och upprepade uppgifter faktiskt ÄR lärande, inte bara en koll på om du har lärt dig det. Hämtar du fram något du nästan har glömt stärker det minnet mer än att läsa det igen.
- Legoanalogin: matte bygger på sig självt, precis som ett legoslott - du måste lägga de nedersta klossarna först, annars rasar det när du bygger vidare på det. Lär du dig det du möter först ordentligt nu, blir det du bygger senare både lättare och stabilare - det är själva svaret på varför det är värt att lära sig matte nu, inte bara "användbart någon gång i framtiden".
- Att träna upp fokus: när du övar på att jobba med något under en längre tid blir du samtidigt bättre på att hålla fokus - lika användbart som att kunna räkna. Det är helt förståeligt att du tappar fokus ibland, särskilt på grund av mobilen - den är gjord för just det. Ett försök visade att elever klarade mer i matte när de la mobilen utanför klassrummet under lektionen; ju mer du övar på att jobba utan avbrott, desto lättare blir det - och det hjälper dig långt utöver matte också.
- Det är helt okej att tycka det är tråkigt: en del tycker matte är roligt, men du behöver absolut inte vara en av dem. Ibland gör du tråkiga saker för att de är bra för dig - som att hålla dig i form eller äta hälsosamt. Tänk på det som ett träningspass: du jobbar koncentrerat en stund, och tar en ordentlig paus när du har rast. Ofta vänder det också: något du tycker är tråkigt kan plötsligt bli roligt den dagen du klarar det - det där "oj, jag klarade det!"-ögonblicket är värt att stanna upp och känna på.
- Empati och hopp: många tycker matte är svårt - det är helt normalt, och inget tecken på att du "inte är bra". Du kan klara det, med rätt träning, precis som alla andra. Använd det här tidigt i samtalet eller när eleven verkar nedslagen - inte bara som något du säger för att trösta helt i slutet.

Samtalet ska ha en riktning, inte bara fortsätta fråga för fråga i det oändliga - försök landa i något ni är överens om mot slutet, som knyter an till kärnbudskapet ovan (varför det är värt att lära sig ämnet, inte bara varför man ska öva jämnt). Spegla gärna tillbaka det eleven själv har sagt under samtalet (t.ex. "Du nämnde att..."), och sammanfatta tillsammans med eleven vad ni har kommit fram till, innan ni avslutar.

Praktiska regler för dialogen:
- En fråga eller ett argument per tur - aldrig en lista eller flera argument samlat
- Be inte eleven skriva långa svar eller texter - det här är ett samtal, inte en skrivuppgift
- Låt elevens svar styra vilket argument du använder härnäst
- Berättar eleven att hen klarade något (löste en uppgift, förstod en poäng, kom ihåg något hen trodde var glömt), stanna upp och gläds tillsammans med hen där och då - det är okej att vara stolt över små saker. Föreslå gärna att hen berättar det för en klasskompis, läraren eller någon hemma
- Möt invändningar (t.ex. "men jag orkar inte") empatiskt, inte med ännu ett argument - ställ hellre en ny fråga
- Använd inte färdighetsträdet eleven fick den här texten från som ledtråd för samtalet - håll dig till det eleven faktiskt säger. Kommer samtalet naturligt in på att repetera eller testa något eleven har lärt sig tidigare, kan du nämna att webbplatsen eleven kopierade den här texten från har en egen knapp, "Skapa prov av avklarade färdigheter", som skapar en ny AI-instruktion för ett litet prov. Säg det på precis det här sättet ("webbplatsen du kopierade den här texten från"), inte bara "färdighetsträdet", så att eleven förstår vad du menar - och använd det bara när det är naturligt, inte som en fast punkt du alltid tar med
- Avsluta samtalet med en kort sammanfattning av vad ni tillsammans har kommit fram till (spegla gärna tillbaka elevens egna ord där det passar), något litet och konkret eleven kan prova (t.ex. att öva 10 minuter idag och 10 minuter imorgon istället för 20 minuter på en gång), och en liten fråga till sist, som "Låter det som något du kan prova?" - inte en lång sammanfattning av alla argument från dig ensam

Starta samtalet direkt med den varma hälsningen och den öppna frågan - inled inte med att sammanfatta den här instruktionen eller med fraser som "Okej, då kör vi".`;
}

const MOTIVATION_INSTRUCTION_TEMPLATE = SHOW_MOTIVATION_BUTTON
  ? buildMotivationInstructionTemplate()
  : null;

// Settes inn i den komponerte instruksen KUN for noder med type "begrep" (se
// composeInstruction under og "KI-instruks: komposisjon" i instruks.md).
// Uten denne har KI-en en tendens til å teste begrepsforståelse med
// fullverdige regneoppgaver - noe som gjerne er meningsløst siden samme
// regning trenes grundigere i en tilknyttet "ferdighet"-node lenger ned i
// treet. Ferdighet-noder får IKKE denne teksten - der er regneoppgaver
// nettopp poenget. (Svensk tekst - se BEGREP_TEST_GUIDANCE i den norske
// motoren for original.)
const BEGREP_TEST_GUIDANCE = `Detta är ett BEGREPP (deklarativ kunskap), inte en räknefärdighet. När du testar om eleven förstår begreppet, använd inte omfattande räkneuppgifter som test - utförlig räkning med begreppet hör hemma i en egen, tillhörande färdighet längre ner i färdighetsträdet, och blir ofta meningslöst att testa här eftersom eleven ändå ska träna grundligt på det där. Testa hellre begreppsförståelsen kvalitativt, till exempel genom att be eleven förklara begreppet med egna ord, förklara ett special-/gränsfall, motivera varför något är eller inte är ett exempel på begreppet, eller identifiera begreppet bland flera alternativ. Om ett test ändå involverar tal, håll räkningen minimal och underordnad - poängen är om eleven förstår begreppet, inte om eleven kan räkna.`;

// Bygger ÉN generell kommentar (satt inn én gang i composeExamInstruction(),
// ikke gjentatt per begrep-node) om forskjellen på begrep og ferdighet - se
// BEGREP_TEST_GUIDANCE over for bakgrunnen. Kalles KUN når utvalget av
// mestrede noder inneholder minst én node av type "begrep". Teksten
// forgrener seg på sammensetningen av utvalget: består det KUN av
// begrep-noder skal hele prøven være kvalitativ, mens en blanding vektes
// gradvis etter andelen begrep-noder. (Svensk tekst - se
// buildExamBegrepGuidance i den norske motoren for original.)
function buildExamBegrepGuidance(nodes) {
  const allBegrep = nodes.every(n => n.type === 'begrep');
  const intro = `Punkterna i listan ovan är märkta [begrepp] eller [färdighet]. [färdighet]-punkter ska testas med fullvärdiga uppgifter, precis som du normalt skulle göra på ett skriftligt prov. [begrepp]-punkter ska däremot ALDRIG bli en fullvärdig räkneuppgift på egen hand - testa hellre begreppsförståelsen kvalitativt, till exempel genom att be eleven förklara begreppet med egna ord, motivera om något är ett exempel på begreppet, identifiera begreppet bland flera alternativ, eller förklara ett special-/gränsfall.`;
  if (allBegrep) {
    return `${intro} Alla punkter i detta urval är [begrepp]-punkter - hela provet ska därför bestå av kvalitativa uppgifter, inga räkneuppgifter.`;
  }
  return `${intro} Vikta uppgiftsmixen efter urvalets sammansättning: ju större andel [begrepp]-punkter i förhållande till [färdighet]-punkter, desto större andel av provet ska vara kvalitativa uppgifter framför räkneuppgifter. En [begrepp]-punkt kan också ingå som en liten, underordnad deluppgift i en uppgift som annars testar en tillhörande [färdighet]-punkt.`;
}

/* ------------------------------------------------------------------ */
/* Global tilstand                                                     */
/* ------------------------------------------------------------------ */

let nodesById = new Map();
let allNodes = [];
let examsByNode = new Map();
let activeNodeId = null;
const validationErrors = [];

// Temaer med tildelt bokstav og noder i indeksert rekkefølge, satt av
// assignLearningGoalIndices() ved hver layout. Brukes av "Visa alla
// lärandemål"-vinduet.
let themeList = [];

/* ------------------------------------------------------------------ */
/* Oppstart                                                             */
/* ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', init);

/* ------------------------------------------------------------------ */
/* Zoom (ctrl+scroll) og "vis hele treet"                              */
/* ------------------------------------------------------------------ */

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 2.5;
let zoomLevel = 1;

// Setter zoomnivå og skalerer #graph-container om origo (0,0). Hvis
// (contentX, contentY) og skjermpunktet (cx, cy) er oppgitt, justeres
// scrollposisjonen slik at akkurat det innholdspunktet blir stående stille
// under musepekeren/fingeren mens man zoomer - ellers "hopper" kartet.
function setZoom(newZoom, contentX, contentY, cx, cy) {
  const scrollEl = document.getElementById('graph-scroll');
  const container = document.getElementById('graph-container');
  zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom));
  container.style.transform = `scale(${zoomLevel})`;
  if (contentX != null) {
    scrollEl.scrollLeft = contentX * zoomLevel - cx;
    scrollEl.scrollTop = contentY * zoomLevel - cy;
  }
}

// Zoomer inn/ut ett steg, sentrert på midten av synlig kartområde.
function zoomBy(factor) {
  const scrollEl = document.getElementById('graph-scroll');
  const cx = scrollEl.clientWidth / 2;
  const cy = scrollEl.clientHeight / 2;
  const contentX = (scrollEl.scrollLeft + cx) / zoomLevel;
  const contentY = (scrollEl.scrollTop + cy) / zoomLevel;
  setZoom(zoomLevel * factor, contentX, contentY, cx, cy);
}

function setupZoom() {
  const scrollEl = document.getElementById('graph-scroll');

  scrollEl.addEventListener('wheel', e => {
    if (!e.ctrlKey && !e.metaKey) return; // vanlig scroll skal fortsatt panorere/scrolle som normalt
    e.preventDefault();
    const rect = scrollEl.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const contentX = (scrollEl.scrollLeft + cx) / zoomLevel;
    const contentY = (scrollEl.scrollTop + cy) / zoomLevel;
    const factor = Math.exp(-e.deltaY * 0.0015);
    setZoom(zoomLevel * factor, contentX, contentY, cx, cy);
  }, { passive: false });

  const group = document.createElement('div');
  group.id = 'zoom-controls';

  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.id = 'zoom-out-btn';
  zoomOutBtn.type = 'button';
  zoomOutBtn.textContent = '−';
  zoomOutBtn.setAttribute('aria-label', 'Zooma ut');
  zoomOutBtn.title = 'Zooma ut';
  zoomOutBtn.addEventListener('click', () => zoomBy(1 / 1.25));
  group.appendChild(zoomOutBtn);

  const btn = document.createElement('button');
  btn.id = 'fit-view-btn';
  btn.type = 'button';
  btn.textContent = '⤢';
  btn.setAttribute('aria-label', 'Visa hela trädet');
  btn.title = 'Visa hela trädet (Ctrl+scroll för att zooma)';
  btn.addEventListener('click', fitToView);
  group.appendChild(btn);

  const zoomInBtn = document.createElement('button');
  zoomInBtn.id = 'zoom-in-btn';
  zoomInBtn.type = 'button';
  zoomInBtn.textContent = '+';
  zoomInBtn.setAttribute('aria-label', 'Zooma in');
  zoomInBtn.title = 'Zooma in';
  zoomInBtn.addEventListener('click', () => zoomBy(1.25));
  group.appendChild(zoomInBtn);

  getBottomToolbar().appendChild(group);
}

// Flytende verktøylinje nederst til venstre - holder kun zoom-kontrollene
// (se setupZoom), siden disse brukes aktivt mens man utforsker kartet.
function getBottomToolbar() {
  let toolbar = document.getElementById('bottom-toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = 'bottom-toolbar';
    document.body.appendChild(toolbar);
  }
  return toolbar;
}

/* ------------------------------------------------------------------ */
/* "Visa alla lärandemål": full, indeksert liste sortert etter tema     */
/* ------------------------------------------------------------------ */

function setupGoalIndexButton() {
  const panel = ensureActionMenu();
  if (!panel) return;

  const btn = document.createElement('button');
  btn.id = 'goal-index-btn';
  btn.type = 'button';
  btn.textContent = 'Visa alla lärandemål';
  btn.title = 'Visa en systematisk lista över alla lärandemål, sorterad efter tema';
  btn.addEventListener('click', () => {
    closeActionMenu();
    openGoalIndexModal();
  });
  panel.appendChild(btn);
}

/* ------------------------------------------------------------------ */
/* Flytende meny-knapp nederst til venstre, ved siden av zoom-knappene:    */
/* samler ALT som før lå i den synlige headeren - tilbake-lenke,           */
/* dag/natt-knapp, fremdriftslinje, tittel/undertekst - og de sjeldnere    */
/* brukte knappene (hjelp, læringsmål-liste, prøvegenerator, motivasjon)   */
/* bak ett trekkspill-panel. Selve <header> tømmes for innhold og skjules  */
/* i CSS. Ligger bevisst nederst til venstre og IKKE øverst til høyre - i  */
/* det hjørnet endte den nesten oppå tilbake-knappen i detaljpanelet når   */
/* det er åpent på mobil.                                                 */
/* ------------------------------------------------------------------ */

// Lages lat og gjenbrukes: én flytende meny-knapp som slår ut/inn et panel
// med alt navigasjons- og statusinnhold pluss de sjeldnere brukte knappene.
// Selve panelet fylles videre av setupMotivationButton/setupHelpButton/
// setupGoalIndexButton/setupExamButton, i den rekkefølgen de kalles fra
// init().
function ensureActionMenu() {
  let panel = document.getElementById('action-menu-panel');
  if (panel) return panel;

  const headerInner = document.querySelector('.header-inner');
  if (!headerInner) return null; // uventet DOM - fail silent fremfor å kaste under init

  // Venstre for zoom-knappene i samme flytende verktøylinje nederst til
  // venstre - IKKE øverst til høyre, der den nesten overlappet
  // tilbake-knappen i detaljpanelet på mobil (begge endte i samme hjørne).
  const toolbar = getBottomToolbar();
  const wrap = document.createElement('div');
  wrap.id = 'menu-wrap';
  toolbar.insertBefore(wrap, toolbar.firstChild);

  const toggle = document.createElement('button');
  toggle.id = 'menu-toggle-btn';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Meny');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.title = 'Meny';
  toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  toggle.addEventListener('click', toggleActionMenu);
  wrap.appendChild(toggle);

  panel = document.createElement('div');
  panel.id = 'action-menu-panel';
  wrap.appendChild(panel);

  // Tilbake-lenke + dag/natt-knapp på samme rad øverst i panelet - akkurat
  // som de lå side om side i den gamle headeren.
  const navRow = document.createElement('div');
  navRow.id = 'menu-nav-row';
  const backLink = headerInner.querySelector('.back-link');
  const themeToggle = headerInner.querySelector('.theme-toggle');
  if (backLink) navRow.appendChild(backLink);
  if (themeToggle) navRow.appendChild(themeToggle);
  if (navRow.children.length) panel.appendChild(navRow);

  // Fremdriftslinje, sidetittel og undertekst er alle statisk/status-
  // informasjon (samme eller sjelden-endret hver gang man besøker siden) -
  // flytt dem inn i panelet i stedet for å ta plass over grafen hele tiden.
  const progressRow = headerInner.querySelector('.progress-row');
  if (progressRow) panel.appendChild(progressRow);
  const heading = headerInner.querySelector('h1');
  const tagline = headerInner.querySelector('p.tagline');
  if (heading) panel.appendChild(heading);
  if (tagline) panel.appendChild(tagline);

  document.addEventListener('click', e => {
    if (!panel.classList.contains('open')) return;
    if (wrap.contains(e.target)) return;
    closeActionMenu();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) closeActionMenu();
  });

  return panel;
}

function toggleActionMenu() {
  const panel = document.getElementById('action-menu-panel');
  const toggle = document.getElementById('menu-toggle-btn');
  if (!panel || !toggle) return;
  const open = panel.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
}

function closeActionMenu() {
  const panel = document.getElementById('action-menu-panel');
  const toggle = document.getElementById('menu-toggle-btn');
  if (!panel) return;
  panel.classList.remove('open');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

// Motivasjonsknapp («Varför ska jag lära mig matte?»). Instruksen er generell
// (samme uansett hvor i treet eleven er), ikke knyttet til én enkelt node -
// se buildMotivationInstructionTemplate.
function setupMotivationButton() {
  const actions = ensureActionMenu();
  if (!actions) return;

  const btn = document.createElement('button');
  btn.id = 'motivation-btn';
  btn.type = 'button';
  btn.textContent = 'Varför ska jag lära mig matte?';
  btn.title = 'Kopiera en AI-instruktion för ett samtal om varför det är värt att lära sig ämnet';
  btn.addEventListener('click', () => {
    const original = btn.textContent;
    navigator.clipboard.writeText(MOTIVATION_INSTRUCTION_TEMPLATE).then(() => {
      btn.textContent = 'Kopierat!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    }).catch(() => {
      window.prompt('Det gick inte att kopiera automatiskt - kopiera texten nedan manuellt:', MOTIVATION_INSTRUCTION_TEMPLATE);
    });
  });
  actions.appendChild(btn);
}

// Hjelp-knapp («Hur använder jag den här sidan?»), alle fag. Åpner en popup
// med en kort, generell forklaring av hvordan kartet skal brukes - ikke
// knyttet til noe fagspesifikt utover om faget viser hjelpemiddel-merking
// og/eller motivasjonsknappen. Egen, alltid synlig knapp rett til høyre for
// meny-knappen (IKKE gjemt bak trekkspill-panelet som de andre sjeldnere
// brukte knappene) - siden dette er det første en ny bruker trenger å finne.
function setupHelpButton() {
  ensureActionMenu(); // sikrer at #menu-wrap finnes i verktøylinjen
  const menuWrap = document.getElementById('menu-wrap');
  if (!menuWrap) return;

  const btn = document.createElement('button');
  btn.id = 'help-btn';
  btn.type = 'button';
  btn.textContent = '?';
  btn.setAttribute('aria-label', 'Hur använder jag den här sidan?');
  btn.title = 'Hur använder jag den här sidan?';
  btn.addEventListener('click', () => {
    closeActionMenu();
    openHelpModal();
  });
  menuWrap.insertAdjacentElement('afterend', btn);
}

// Modalen bygges lat, én gang, og gjenbrukes ved senere åpninger - samme
// mønster som ensureGoalIndexModal under.
function ensureHelpModal() {
  let overlay = document.getElementById('help-overlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'help-overlay';
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeHelpModal();
  });

  const modal = document.createElement('div');
  modal.id = 'help-modal';

  const header = document.createElement('div');
  header.id = 'help-header';

  const h2 = document.createElement('h2');
  h2.textContent = 'Hur använder jag den här sidan?';
  header.appendChild(h2);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn secondary';
  closeBtn.textContent = '✕ Stäng';
  closeBtn.addEventListener('click', closeHelpModal);
  header.appendChild(closeBtn);

  modal.appendChild(header);

  const body = document.createElement('div');
  body.id = 'help-body';
  renderHelpBody(body);
  modal.appendChild(body);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeHelpModal();
  });

  return overlay;
}

function helpSection(body, heading, text) {
  const h3 = document.createElement('h3');
  h3.textContent = heading;
  body.appendChild(h3);
  const p = document.createElement('p');
  p.textContent = text;
  body.appendChild(p);
}

function renderHelpBody(body) {
  body.innerHTML = '';

  helpSection(body, 'Menyknappen',
    'Tryck på ☰-knappen längst ner till vänster, bredvid den här hjälpknappen, för att öppna en meny med tillbaka-länk, ljust/mörkt läge, ditt framsteg och de andra knapparna på sidan - förklarade nedan.');

  helpSection(body, 'Kartan',
    'Kartan visar hur färdigheter och begrepp bygger på varandra, från det mest grundläggande till vänster till det mest sammansatta till höger. Rutorna du inte har förkunskaperna för än ser du som grå och låsta - kryssa i det som saknas först. Dra för att panorera kartan, och använd +/- eller mushjulet för att zooma.');

  helpSection(body, 'Klicka på en ruta',
    'När du klickar på en ruta får du upp förkunskaperna, en fullständig beskrivning av lärandemålet, och en AI-instruktion du kan kopiera och klistra in i en AI-chatt för att träna på just den färdigheten. Markera rutan som avklarad när du kan den - framstegen sparas i din webbläsare, och du kan ta bort markeringen igen när du vill.');

  helpSection(body, '«Visa alla lärandemål»',
    'När du trycker på den här knappen får du en samlad, systematisk lista över alla lärandemålen i ämnet, sorterad efter tema - praktiskt när du vill ha överblick eller läsa igenom hela listan utan att klicka dig igenom kartan. Varje lärandemål visar status: ✓ betyder att du markerat det som avklarat, ◇ att du har allt du behöver för att lära dig det nu, och ⊘ visar vilka lärandemål du bör ta först (med deras kod, t.ex. C1).');

  helpSection(body, '«Skapa lektionsplanering» (för lärare)',
    'Längst ner i «Visa alla lärandemål» kan lärare kryssa i de lärandemål nästa lektion ska täcka, ställa in lektionens längd, och få en AI-instruktion för en färdig lektionsplanering: starter, genomgång enligt example-problem pair-modellen, diagnostiska frågor och återkallning på slutet. Ikryssningarna för avklarat är dina egna, i din egen webbläsare - de visar vad du själv gått igenom, inte vad klassen faktiskt kan.');

  helpSection(body, '«Skapa prov av avklarade färdigheter»',
    'När du trycker på den här knappen får du en AI-instruktion för ett prov som täcker ett urval av det du redan markerat som avklarat. Klistra in den i en AI-chatt för att testa dig själv över flera färdigheter samtidigt.');

  if (SHOW_HJELPEMIDDEL) {
    helpSection(body, 'D1 / D2',
      'Märkningen på en ruta visar vilken del av provet färdigheten hör till - del 1 (utan hjälpmedel) eller del 2 (med hjälpmedel), eller båda.');
  }

  if (SHOW_MOTIVATION_BUTTON) {
    helpSection(body, '«Varför ska jag lära mig matte?»',
      'När du trycker på den här knappen får du en AI-instruktion för ett kort samtal om varför det är värt att lära sig ämnet överhuvudtaget. Klistra in den i en AI-chatt om du behöver en knuff i rätt riktning.');
  }
}

function openHelpModal() {
  const overlay = ensureHelpModal();
  overlay.classList.add('open');
}

function closeHelpModal() {
  const overlay = document.getElementById('help-overlay');
  if (overlay) overlay.classList.remove('open');
}

function composeGoalIndexText() {
  return themeList
    .map(({ letter, topic, nodes }) => {
      const lines = nodes.map(n => `${n.goalIndex}) ${n.navn}`).join('\n');
      return `${letter}) ${topic}\n${lines}`;
    })
    .join('\n\n');
}

// Modalen bygges lat, én gang, og gjenbrukes ved senere åpninger.
function ensureGoalIndexModal() {
  let overlay = document.getElementById('goal-index-overlay');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'goal-index-overlay';
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeGoalIndexModal();
  });

  const modal = document.createElement('div');
  modal.id = 'goal-index-modal';

  const header = document.createElement('div');
  header.id = 'goal-index-header';

  const h2 = document.createElement('h2');
  h2.textContent = 'Alla lärandemål';
  header.appendChild(h2);

  const actions = document.createElement('div');
  actions.id = 'goal-index-actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn';
  copyBtn.textContent = 'Kopiera alla';
  copyBtn.addEventListener('click', () => {
    const text = composeGoalIndexText();
    navigator.clipboard.writeText(text).then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Kopierat!';
      setTimeout(() => { copyBtn.textContent = original; }, 1500);
    }).catch(() => {
      window.prompt('Det gick inte att kopiera automatiskt - kopiera texten nedan manuellt:', text);
    });
  });
  actions.appendChild(copyBtn);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn secondary';
  closeBtn.textContent = '✕ Stäng';
  closeBtn.addEventListener('click', closeGoalIndexModal);
  actions.appendChild(closeBtn);

  header.appendChild(actions);
  modal.appendChild(header);

  const body = document.createElement('div');
  body.id = 'goal-index-body';
  modal.appendChild(body);

  // Fast bunnlinje (utenfor det scrollbare innholdet) med undervisnings-
  // opplegg-generatoren. Ligger her og ikke i handlingsmenyen fordi selve
  // utvalget av læringsmål skjer i denne lista - knapp og utvalg hører
  // sammen.
  const bar = document.createElement('div');
  bar.id = 'lesson-plan-bar';

  const countLabel = document.createElement('span');
  countLabel.id = 'lesson-plan-count';
  bar.appendChild(countLabel);

  const minutesLabel = document.createElement('label');
  minutesLabel.id = 'lesson-minutes-label';
  minutesLabel.appendChild(document.createTextNode('Längd'));
  const minutesInput = document.createElement('input');
  minutesInput.type = 'number';
  minutesInput.id = 'lesson-minutes';
  minutesInput.min = '15';
  minutesInput.max = '240';
  minutesInput.step = '5';
  minutesInput.value = String(LESSON_DEFAULT_MINUTES);
  minutesInput.setAttribute('aria-label', 'Lektionens längd i minuter');
  minutesLabel.appendChild(minutesInput);
  minutesLabel.appendChild(document.createTextNode('min'));
  bar.appendChild(minutesLabel);

  const planBtn = document.createElement('button');
  planBtn.id = 'lesson-plan-btn';
  planBtn.type = 'button';
  planBtn.textContent = 'Skapa lektionsplanering (för lärare)';
  planBtn.title = 'Kopiera en AI-instruktion för en färdig lektion om de lärandemål du kryssat i';
  planBtn.addEventListener('click', () => {
    const nodes = getLessonSelectionNodes();
    if (!nodes.length) return;

    const minutes = Math.min(240, Math.max(15, parseInt(minutesInput.value, 10) || LESSON_DEFAULT_MINUTES));
    minutesInput.value = minutes;
    const text = composeLessonPlanInstruction(nodes, minutes);

    const original = planBtn.textContent;
    navigator.clipboard.writeText(text).then(() => {
      planBtn.textContent = 'Kopierat!';
      setTimeout(() => { planBtn.textContent = original; }, 1500);
    }).catch(() => {
      window.prompt('Kunde inte kopiera automatiskt - kopiera texten nedan manuellt:', text);
    });
  });
  bar.appendChild(planBtn);

  modal.appendChild(bar);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeGoalIndexModal();
  });

  return overlay;
}

/* ------------------------------------------------------------------ */
/* Undervisningsopplegg: flyktig utvalg av læringsmål                   */
/* ------------------------------------------------------------------ */

// VIKTIG SKILLE: `mestret` (localStorage, se getProgress) er en VARIG
// tilstand om eleven/klassen og driver fremdriftslinja og prøvegeneratoren.
// `lessonSelection` er noe helt annet: et FLYKTIG utvalg av hvilke
// læringsmål én bestemt undervisningsøkt skal dekke. Det lagres bevisst
// ikke - verken i localStorage eller i CSV - og nullstilles ved reload.
// Å presse begge inn i samme avkryssing på noden i kartet ville gjort
// kartet uleselig; derfor bor dette utvalget kun i læringsmål-lista.
const lessonSelection = new Set();

// Faste rammer for timeplanen. Starter og gjenhenting har fast lengde
// uansett hvor lang økta er; resten av tiden fordeles likt på de valgte
// læringsmålene. Blir det mindre enn LESSON_MIN_GOAL_BLOCK minutter igjen
// per læringsmål, ber instruksen KI-en si fra til læreren om at utvalget er
// for stort for tiden (se composeLessonPlanInstruction).
const LESSON_DEFAULT_MINUTES = 45;
const LESSON_STARTER_MIN = 7;
const LESSON_RECALL_MIN = 5;
const LESSON_DIAGNOSTIC_MIN = 3;
const LESSON_MIN_GOAL_BLOCK = 12;

// Sorteringsnøkkel for en nodes auto-genererte læringsmålkode (A1, A2, ..., B1):
// bokstav først, deretter tall NUMERISK - ren strengsortering ville gitt
// A10 før A2.
function goalIndexSortKey(node) {
  const m = /^([A-Z]+)(\d+)$/.exec(node.goalIndex || '');
  return m ? [m[1], parseInt(m[2], 10)] : ['', 0];
}

function compareByGoalIndex(a, b) {
  const [la, na] = goalIndexSortKey(a);
  const [lb, nb] = goalIndexSortKey(b);
  return la < lb ? -1 : la > lb ? 1 : na - nb;
}

// Alle forfedre (rekursivt, ikke bare direkte foreldre) som IKKE er markert
// som mestret. Brukes kun til å vise status i læringsmål-lista - ikke i
// KI-instruksen for undervisningsopplegget, som bevisst antar at alt
// underliggende er mestret (se composeLessonPlanInstruction).
function getMissingAncestors(node, progress) {
  return getAllAncestors(node)
    .filter(a => !isNodeMastered(a, progress))
    .sort(compareByGoalIndex);
}

// Tre-delt status per node i læringsmål-lista:
//   mestret  - eleven/læreren har krysset av noden
//   klar     - ikke mestret, men alle forutsetninger er det (== isAvailable)
//   mangler  - noen forutsetninger mangler; de listes med kode (C1, C2, ...)
function goalStatus(node, progress) {
  if (isNodeMastered(node, progress)) {
    return { kind: 'mastered', symbol: '✓', text: 'Avklarad' };
  }
  const missing = getMissingAncestors(node, progress);
  if (!missing.length) {
    return { kind: 'ready', symbol: '◇', text: 'Redo att läras' };
  }
  const codes = missing.map(m => m.goalIndex).join(', ');
  return {
    kind: 'blocked',
    symbol: '⊘',
    text: `Saknas först: ${codes}`,
    title: missing.map(m => `${m.goalIndex}) ${m.navn}`).join('\n'),
  };
}

function renderGoalIndexBody(body) {
  body.innerHTML = '';
  const progress = getProgress();

  const intro = document.createElement('p');
  intro.id = 'goal-index-intro';
  intro.textContent = 'Listan visar alla lärandemål i ämnet, sorterade efter tema, med status för vart och ett. För lärare: kryssa i de lärandemål nästa lektion ska täcka, och skapa en färdig lektionsplanering längst ner.';
  body.appendChild(intro);

  themeList.forEach(({ letter, topic, nodes }) => {
    const section = document.createElement('div');
    section.className = 'goal-index-section';

    const h3 = document.createElement('h3');
    h3.textContent = `${letter}) ${topic}`;
    section.appendChild(h3);

    const ul = document.createElement('ul');
    nodes.forEach(n => {
      const status = goalStatus(n, progress);

      const li = document.createElement('li');
      li.className = 'goal-index-item status-' + status.kind;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'goal-pick';
      cb.id = 'goal-pick-' + n.id;
      cb.checked = lessonSelection.has(n.id);
      cb.setAttribute('aria-label', `Ta med «${n.navn}» i lektionsplaneringen`);
      cb.addEventListener('change', () => {
        if (cb.checked) lessonSelection.add(n.id);
        else lessonSelection.delete(n.id);
        updateLessonPlanBar();
      });
      li.appendChild(cb);

      const main = document.createElement('div');
      main.className = 'goal-index-item-main';

      const label = document.createElement('label');
      label.setAttribute('for', cb.id);
      label.className = 'goal-index-item-name';
      label.textContent = `${n.goalIndex}) ${n.navn}`;
      main.appendChild(label);

      const badge = document.createElement('span');
      badge.className = 'goal-index-item-status';
      badge.textContent = `${status.symbol} ${status.text}`;
      if (status.title) badge.title = status.title;
      main.appendChild(badge);

      li.appendChild(main);
      ul.appendChild(li);
    });
    section.appendChild(ul);

    body.appendChild(section);
  });
}

function openGoalIndexModal() {
  const overlay = ensureGoalIndexModal();
  renderGoalIndexBody(document.getElementById('goal-index-body'));
  updateLessonPlanBar();
  overlay.classList.add('open');
}

function closeGoalIndexModal() {
  const overlay = document.getElementById('goal-index-overlay');
  if (overlay) overlay.classList.remove('open');
}

/* ------------------------------------------------------------------ */
/* Prøvegenerator: KI-instruks for en prøve basert på mestrede noder    */
/* ------------------------------------------------------------------ */

function setupExamButton() {
  const actions = ensureActionMenu();
  if (!actions) return;

  const widget = document.createElement('div');
  widget.id = 'exam-widget';

  const countLabel = document.createElement('label');
  countLabel.id = 'exam-count-label';
  countLabel.textContent = 'Antal uppgifter';
  const countInput = document.createElement('input');
  countInput.type = 'number';
  countInput.id = 'exam-count';
  countInput.min = '1';
  countInput.max = '50';
  countInput.value = '10';
  countInput.setAttribute('aria-label', 'Antal uppgifter i provet');
  countLabel.appendChild(countInput);
  widget.appendChild(countLabel);

  const examBtn = document.createElement('button');
  examBtn.id = 'exam-btn';
  examBtn.type = 'button';
  examBtn.textContent = 'Skapa prov av avklarade färdigheter';
  examBtn.title = 'Kopiera en AI-instruktion för att skapa ett prov baserat på det du har markerat som avklarat';
  widget.appendChild(examBtn);

  examBtn.addEventListener('click', () => {
    const original = examBtn.textContent;
    const progress = getProgress();
    const masteredNodes = allNodes.filter(n => isNodeMastered(n, progress));

    if (!masteredNodes.length) {
      examBtn.textContent = 'Inga avklarade färdigheter än';
      setTimeout(() => { examBtn.textContent = original; }, 1800);
      return;
    }

    const count = Math.min(50, Math.max(1, parseInt(countInput.value, 10) || 10));
    countInput.value = count;
    const text = composeExamInstruction(masteredNodes, count);

    navigator.clipboard.writeText(text).then(() => {
      examBtn.textContent = 'Kopierat!';
      setTimeout(() => { examBtn.textContent = original; }, 1500);
    }).catch(() => {
      window.prompt('Det gick inte att kopiera automatiskt - kopiera texten nedan manuellt:', text);
    });
  });

  actions.appendChild(widget);
}

function hjelpemiddelKort(value) {
  return value === 'del1' ? 'D1' : value === 'del2' ? 'D2' : 'D1+D2';
}

// Setter sammen en KI-instruks for å lage en prøve på tvers av alle noder
// eleven (eller læreren) har markert som mestret - ikke bare én enkelt node
// slik composeInstruction() gjør. Prøven trenger ikke dekke alle mestrede
// noder; instruksen ber KI-en velge et representativt utvalg på `count`
// oppgaver som til sammen dekker flest mulig av dem.
function composeExamInstruction(nodes, count) {
  const courseLabel = CONFIG.courseName || 'ämnet';
  const list = nodes
    .map(n => {
      const tags = [typeLabelText(n.type)];
      if (SHOW_HJELPEMIDDEL) tags.push(hjelpemiddelKort(n.hjelpemiddel));
      return `- ${n.navn} [${tags.join(', ')}]: ${n.beskrivelse}`;
    })
    .join('\n');

  const parts = [];
  parts.push(`Du är en AI-inlärningsassistent som ska skapa ett skriftligt prov i ${courseLabel} till en elev, baserat på de färdigheter och begrepp eleven (eller läraren) har markerat som avklarade i färdighetsträdet.`);
  parts.push(`Följande ${nodes.length} färdigheter/begrepp är markerade som avklarade:\n${list}`);
  parts.push(`Skapa ett prov med exakt ${count} uppgift(er). Provet behöver inte täcka alla punkter ovan - välj hellre ut ett representativt urval som tillsammans täcker så många som möjligt av dem, variera svårighetsgrad, och låt gärna några uppgifter kombinera flera av färdigheterna. Numrera uppgifterna och formulera dem som de typiskt skulle sett ut på ett skriftligt prov i ämnet.`);

  if (nodes.some(n => n.type === 'begrep')) {
    parts.push(buildExamBegrepGuidance(nodes));
  }

  if (SHOW_HJELPEMIDDEL) {
    const hasDel1 = nodes.some(n => n.hjelpemiddel === 'del1' || n.hjelpemiddel === 'begge');
    const hasDel2 = nodes.some(n => n.hjelpemiddel === 'del2' || n.hjelpemiddel === 'begge');
    if (hasDel1 || hasDel2) {
      const hjelpemiddelParts = [];
      if (hasDel1) hjelpemiddelParts.push(composeHjelpemiddelContext('del1'));
      if (hasDel2) hjelpemiddelParts.push(composeHjelpemiddelContext('del2'));
      parts.push(`Märk varje uppgift med [D1] eller [D2] efter vilken del den hör till, och håll dig till rätt hjälpmedelsanvändning för respektive del:\n${hjelpemiddelParts.join('\n')}`);
    }
  }

  parts.push('Visa ENDAST uppgifterna först, utan facit. Ge inte facit förrän eleven har svarat - vänta tills eleven ber om bedömning (antingen efter varje uppgift, eller efter att ha svarat på alla samtidigt). Ge då ett fullständigt facit med motivering för varje svar, en kort bedömning av vad eleven klarade, och vad hen bör öva mer på.');

  return parts.join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Undervisningsopplegg: KI-instruks for én konkret undervisningsøkt    */
/* ------------------------------------------------------------------ */

// De valgte nodene, sortert slik de bør undervises: nivaa først (en
// forutsetning har alltid lavere nivå enn det som bygger på den, også på
// tvers av emner - se computeLevels), deretter læringsmålkode som stabil
// tie-break.
function getLessonSelectionNodes() {
  return allNodes
    .filter(n => lessonSelection.has(n.id))
    .sort((a, b) => a.nivaa - b.nivaa || compareByGoalIndex(a, b));
}

function updateLessonPlanBar() {
  const countLabel = document.getElementById('lesson-plan-count');
  const btn = document.getElementById('lesson-plan-btn');
  if (!countLabel || !btn) return;
  const n = lessonSelection.size;
  countLabel.textContent = n === 0
    ? 'Inga lärandemål valda'
    : n === 1 ? '1 lärandemål valt' : `${n} lärandemål valda`;
  btn.disabled = n === 0;
}

// Fordeler den oppgitte lengden på økta: starter og gjenhenting har fast
// lengde, resten deles likt mellom de valgte læringsmålene (overskytende
// minutter går til de første målene, så summen alltid går opp). Motoren
// regner dette ut i stedet for å overlate fordelingen til KI-en, slik at
// læreren får en forutsigbar timeplan uansett hvilken modell hen bruker.
function buildLessonSchedule(nodes, totalMinutes) {
  const teachingTotal = Math.max(nodes.length, totalMinutes - LESSON_STARTER_MIN - LESSON_RECALL_MIN);
  const base = Math.floor(teachingTotal / nodes.length);
  const extra = teachingTotal - base * nodes.length;

  const lines = [];
  let t = 0;
  lines.push(`${t}-${t + LESSON_STARTER_MIN} min: Starter`);
  t += LESSON_STARTER_MIN;

  nodes.forEach((node, i) => {
    const len = base + (i < extra ? 1 : 0);
    const diag = Math.min(LESSON_DIAGNOSTIC_MIN, Math.max(1, len - 1));
    lines.push(`${t}-${t + len} min: Lärandemål ${i + 1} - ${node.navn}. Av dessa avsätts de sista ${diag} minuterna till den diagnostiska frågan.`);
    t += len;
  });

  lines.push(`${t}-${t + LESSON_RECALL_MIN} min: Återkallning`);
  t += LESSON_RECALL_MIN;

  return { text: lines.join('\n'), perGoal: base, tight: base < LESSON_MIN_GOAL_BLOCK, total: t };
}

// Fast metodikk-tekst, lik for alle fag. Ligger hardkodet her (ikke i CSV
// og ikke i config.js) på samme måte som BEGREP_TEST_GUIDANCE: dette er
// didaktikk som gjelder på tvers av fag, ikke fagspesifikt innhold.
const LESSON_STARTER_GUIDANCE = `BLOCK 1 - STARTER (${LESSON_STARTER_MIN} minuter)
Skapa EN öppen uppgift som hela klassen kan börja med direkt, och som leder in mot dagens lärandemål.
Krav på startern:
- Den ska få plats på en enda PowerPoint-slide eller på tavlan. Skriv ut den ordagrant, precis som den ska stå där.
- Den ska vara ÖPPEN: det ska inte finnas bara ett rätt svar, utan många möjliga svar eller många vägar fram. Eleverna ska kunna hålla på i flera minuter utan att bli "färdiga".
- Den ska ha låg tröskel. En elev som inte kan något av det som ska läras i dag ska ändå kunna börja direkt. Det här är det svåraste kravet: startern ska INTE bygga på förkunskaper utöver det som står i förkunskapslistan ovan, och helst inte ens på allt det.
- Den ska bjuda in till att prova, gissa, jämföra med bänkgrannen och justera.
Ett exempel på FORMEN (inte på innehållet): "Titta på de här bråken: 1/2, 1/3, 1/4, 1/6, 1/8. Lägg ihop några av dem så att du kommer så nära 1 som möjligt."
Skriv dessutom 2-3 meningar till läraren om hur startern leder in mot dagens lärandemål, och vad läraren ska titta efter medan eleverna arbetar.`;

const LESSON_EPP_GUIDANCE = `HUVUDDELEN - ETT LÄRANDEMÅL I TAGET
Undervisningen av varje lärandemål ska följa example-problem pair-modellen: läraren gör en uppgift, eleverna gör en motsvarande uppgift, och sedan upprepas det med en lite svårare uppgift.
Skapa 2-3 sådana rundor per lärandemål. Varje runda består av:

a) LÄRARENS UPPGIFT - en uppgift läraren gör på tavlan, färdigt uträknad med alla mellanled, skrivna som de ska stå på tavlan. Föreslå också HUR läraren ska göra den, och variera mellan rundorna. Möjliga varianter:
   - Läraren gör hela uppgiften i FULLSTÄNDIG TYSTNAD, utan att säga ett ord, och eleverna måste efteråt förklara för bänkgrannen - eller skriva ner för sig själva - vad läraren gjorde och varför.
   - Läraren tänker högt under tiden.
   - Läraren gör ett medvetet felsteg som eleverna ska hitta.
   - Läraren stannar halvvägs och låter klassen föreslå nästa steg.

b) ELEVERNAS UPPGIFTER - flera uppgifter som liknar lärarens, i stigande svårighetsgrad, så att elever som blir snabbt klara har mer att ta sig an. Ge minst tre. VIKTIGT: de extra uppgifterna ska ligga I SIDLED i förhållande till kursprogressionen - samma typ av uppgift med andra tal, ny inramning eller en liten vridning - och INTE framåt mot nästa runda. Nästa, svårare steg ska läraren själv gå igenom i nästa runda; föregriper de extra uppgifterna det, förlorar nästa runda sin poäng. Markera tydligt vilken av uppgifterna läraren ska gå igenom efteråt (den enklaste). Ge facit till alla.

Rundorna ska bygga uppåt: första rundan är det enklaste fallet, sista rundan ligger nära hur lärandemålet faktiskt ska behärskas.

c) EGET ARBETE - efter sista rundan, tre uppgiftsset på olika nivå (t.ex. "Kom igång", "Vidare", "Utmaning") som eleverna arbetar med på egen hand. Eleverna väljer själva, eller läraren fördelar. Ge fullständigt facit till alla tre seten.`;

const LESSON_BEGREP_GUIDANCE = `ANPASSNING FÖR BEGREPP
Några av lärandemålen ovan är märkta [begrepp]. Det är deklarativ kunskap, inte en räknefärdighet, och example-problem pair-modellen ovan är skriven för räknefärdigheter. Gör därför en enkel anpassning för dessa: lärarens "uppgift" blir i stället att läraren visar upp och går igenom några exempel och icke-exempel på begreppet, och elevernas "uppgifter" blir att avgöra om nya fall är exempel på begreppet eller inte och motivera varför, eller att förklara begreppet med egna ord. Det egna arbetet blir på motsvarande sätt kvalitativt. Håll räkningen minimal och underordnad i dessa block - själva räknefärdigheten hör hemma i ett eget lärandemål längre ner i färdighetsträdet.`;

const LESSON_DIAGNOSTIC_GUIDANCE = `DIAGNOSTISK FRÅGA - avsluta VARJE lärandemål med en, innan klassen går vidare
En diagnostisk fråga är en flervalsfråga med exakt fyra alternativ, numrerade 1, 2, 3 och 4. De felaktiga alternativen ska inte vara slumpmässiga: vart och ett av dem ska motsvara en KONKRET, vanlig missuppfattning kopplad till just det här lärandemålet. Skriv på en egen rad till läraren vilken missuppfattning varje felaktigt alternativ fångar upp, så att läraren vet vad ett svar faktiskt betyder.
Krav på frågan:
- Den ska få plats på en slide eller på tavlan, och kunna besvaras på under 30 sekunder utan uträkning på papper.
- Alla fyra alternativen ska se rimliga ut. Inga uppenbart tokiga alternativ - då svarar eleverna rätt utan att förstå.
Genomförande (skriv in det i planeringen): läraren visar frågan, eleverna tänker i tystnad i 30 sekunder, och på lärarens signal svarar ALLA samtidigt genom att visa antal fingrar. Poängen är att hela klassen måste ta ställning, inte bara den som räcker upp handen.
- Svarar så gott som alla rätt: gå direkt vidare till nästa lärandemål.
- Är klassen delad: ge inte facit direkt. Föreslå ett sätt att ta tag i missuppfattningen på, och variera mellan lärandemålen:
  (i) en elev per alternativ får argumentera för sitt svar medan läraren och resten av klassen bara lyssnar, utan att avbryta eller korrigera - och därefter röstar klassen på nytt;
  (ii) eleverna diskuterar två och två med bänkgrannen i en minut och röstar på nytt;
  (iii) eleverna går ihop i grupper efter vilket alternativ de valde, och ska enas om ett gemensamt argument före ny omröstning.
  Först efter den nya omröstningen går läraren igenom rätt svar - och förklarar då uttryckligen varför vart och ett av de felaktiga alternativen är fel.`;

const LESSON_RECALL_GUIDANCE = `SISTA BLOCKET - ÅTERKALLNING (${LESSON_RECALL_MIN} minuter)
Avsluta lektionen med återkallning: eleverna stänger bok och anteckningar och skriver ner i sin bok allt de kommer ihåg att de lärt sig i dag. Skriv ut det konkreta besked läraren ska ge, klart att sättas på en slide eller tavlan. Ge dessutom läraren 2-3 korta hjälpfrågor hen kan skriva på tavlan om några elever inte kommer igång. Skriv också en mening om varför det här görs - att det är att hämta fram något ur minnet som fäster det, inte att läsa det igen - så att läraren kan säga det till klassen.`;

const LESSON_FORMAT_GUIDANCE = `FORMAT PÅ SVARET
Skriv planeringen som en sammanhängande plan läraren kan läsa uppifrån och ner medan hen undervisar. Använd en rubrik med minutangivelse för varje block, i samma ordning som tidsplanen ovan.
Allt som ska visas upp för eleverna - startuppgiften, lärarens exempel, elevuppgifterna, den diagnostiska frågan och beskedet om återkallning - ska stå i ett eget, tydligt avgränsat block som börjar med "PÅ TAVLAN:" på egen rad. Innehållet i ett sådant block ska vara skrivet ordagrant som det ska stå på slide eller tavla, utan instruktioner till läraren inuti blocket. Allt annat - vad läraren ska göra och säga, facit, vad hen ska titta efter - står utanför blocken. Då kan läraren kopiera "PÅ TAVLAN"-blocken rakt in i PowerPoint.
Ge fullständigt facit till alla uppgifter, i egna stycken märkta "Facit", alltid utanför "PÅ TAVLAN"-blocken.
Skriv enkelt och konkret, och undvik didaktiska fackord i texten som ska visas för eleverna.`;

// Setter sammen KI-instruksen for en hel undervisningsøkt. I motsetning til
// composeInstruction() (som henvender seg til ELEVEN om én node) og
// composeExamInstruction() (som bygger på MESTREDE noder) henvender denne
// seg til LÆREREN, og bygger på noder som ennå ikke er mestret - de som
// skal undervises.
//
// Merk et bevisst valg: forutsetningene (forfedrene til de valgte nodene)
// antas mestret uansett hva som faktisk er huket av i treet, og det gis
// ingen advarsel til læreren om manglende forutsetninger. En lærer som ikke
// orker å krysse av alt ville ellers druknet i advarsler. Hvilke
// forutsetninger som faktisk mangler, vises i stedet som status i
// læringsmål-lista (se goalStatus).
function composeLessonPlanInstruction(nodes, totalMinutes) {
  const courseLabel = CONFIG.courseName || 'ämnet';
  const schedule = buildLessonSchedule(nodes, totalMinutes);
  const parts = [];

  parts.push(`Du är en erfaren ämnesdidaktiker som ska hjälpa en LÄRARE att planera en konkret lektion i ${courseLabel}. Du talar med läraren, inte med eleven. Svara med själva lektionsplaneringen direkt - ställ inga klargörande frågor först, och inled inte med att sammanfatta den här instruktionen. Läraren kan be om justeringar efteråt.`);

  parts.push('Om du har någon form av minnesfunktion mellan samtal (långtidsminne) ska du inte spara något från det här samtalet där - varken om läraren, klassen eller ämnet. Planeringen gäller bara den här enda lektionen här och nu.');

  const goalList = nodes
    .map((n, i) => {
      const tags = [typeLabelText(n.type)];
      if (SHOW_HJELPEMIDDEL) tags.push(hjelpemiddelKort(n.hjelpemiddel));
      return `${i + 1}. ${n.navn} [${tags.join(', ')}]\n   ${n.beskrivelse}`;
    })
    .join('\n');
  parts.push(`Lektionen är ${schedule.total} minuter lång och ska täcka följande ${nodes.length} lärandemål, i den här ordningen:\n${goalList}`);

  // Forutsetningene utledes automatisk fra avhenger_av-kjeden, på samme måte
  // som i composeInstruction() - læreren velger kun målene for økta.
  const selectedIds = new Set(nodes.map(n => n.id));
  const prerequisites = [];
  const seen = new Set();
  nodes.forEach(node => {
    getAllAncestors(node).forEach(a => {
      if (selectedIds.has(a.id) || seen.has(a.id)) return;
      seen.add(a.id);
      prerequisites.push(a);
    });
  });

  if (prerequisites.length) {
    const names = prerequisites.sort(compareByGoalIndex).map(a => `- ${a.navn}`).join('\n');
    parts.push(`Eleverna har sedan tidigare gått igenom följande färdigheter och begrepp, som dagens lärandemål bygger vidare på. Utgå från det: du kan bygga på dem, använda orden fritt utan att definiera om dem, och dra in dem i både startern och exemplen.\n${names}`);
  } else {
    parts.push('Dagens lärandemål har inga registrerade förkunskaper i färdighetsträdet - anta att området är helt nytt för eleverna.');
  }

  parts.push(`Följ den här tidsplanen, och skriv in minutangivelsen i planeringen för varje block:\n${schedule.text}`);

  if (schedule.tight) {
    parts.push(`OBS: med ${nodes.length} lärandemål på ${schedule.total} minuter blir det bara omkring ${schedule.perGoal} minuter per lärandemål. Det är för lite för att hinna med både example-problem pair-rundor, eget arbete och en diagnostisk fråga. Inled därför planeringen med en kort, vänlig anmärkning till läraren om det, och föreslå konkret vilket eller vilka lärandemål som bör flyttas till en senare lektion. Skapa sedan en fullständig planering för alla målen ändå, enligt tidsplanen ovan.`);
  }

  parts.push(LESSON_STARTER_GUIDANCE);
  parts.push(LESSON_EPP_GUIDANCE);
  if (nodes.some(n => n.type === 'begrep')) parts.push(LESSON_BEGREP_GUIDANCE);
  parts.push(LESSON_DIAGNOSTIC_GUIDANCE);
  parts.push(LESSON_RECALL_GUIDANCE);

  if (SHOW_HJELPEMIDDEL) {
    const hasDel1 = nodes.some(n => n.hjelpemiddel === 'del1' || n.hjelpemiddel === 'begge');
    const hasDel2 = nodes.some(n => n.hjelpemiddel === 'del2' || n.hjelpemiddel === 'begge');
    if (hasDel1 || hasDel2) {
      const hjelpemiddelParts = [];
      if (hasDel1) hjelpemiddelParts.push(composeHjelpemiddelContext('del1'));
      if (hasDel2) hjelpemiddelParts.push(composeHjelpemiddelContext('del2'));
      parts.push(`Håll dig till rätt hjälpmedelsanvändning i uppgifterna du skapar, efter vilken del varje lärandemål hör till (märkt [D1]/[D2] i listan ovan):\n${hjelpemiddelParts.join('\n')}`);
    }
  }

  parts.push(LESSON_FORMAT_GUIDANCE);

  return parts.join('\n\n');
}

// Zoomer ut (aldri inn utover 100%) og flytter visningen slik at hele
// grafen - alle emne-kolonner - får plass i det synlige området.
function fitToView() {
  const scrollEl = document.getElementById('graph-scroll');
  const container = document.getElementById('graph-container');
  const contentWidth = parseInt(container.style.width, 10) || container.scrollWidth;
  const contentHeight = parseInt(container.style.height, 10) || container.scrollHeight;
  if (!contentWidth || !contentHeight) return;

  const margin = 0.92; // litt luft rundt kartet
  const fit = Math.min(
    (scrollEl.clientWidth / contentWidth) * margin,
    (scrollEl.clientHeight / contentHeight) * margin,
    1
  );
  setZoom(fit);
  scrollEl.scrollLeft = 0;
  scrollEl.scrollTop = 0;
}

function setupPanning() {
  const scrollEl = document.getElementById('graph-scroll');
  const DRAG_THRESHOLD = 4;
  let isPanning = false;
  let didDrag = false;
  let startX = 0, startY = 0, startScrollLeft = 0, startScrollTop = 0;

  scrollEl.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (e.target.closest('.node-box, input, a, button, textarea')) return;
    isPanning = true;
    didDrag = false;
    startX = e.clientX;
    startY = e.clientY;
    startScrollLeft = scrollEl.scrollLeft;
    startScrollTop = scrollEl.scrollTop;
    scrollEl.classList.add('panning');
  });

  window.addEventListener('mousemove', e => {
    if (!isPanning) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!didDrag && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      didDrag = true;
    }
    if (didDrag) {
      scrollEl.scrollLeft = startScrollLeft - dx;
      scrollEl.scrollTop = startScrollTop - dy;
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isPanning) return;
    isPanning = false;
    scrollEl.classList.remove('panning');
  });

  // Hindre at et klikk på en node åpner detaljpanelet når museklikket
  // faktisk var starten på et dra (f.eks. dra-panorering som slutter oppå en node).
  scrollEl.addEventListener('click', e => {
    if (didDrag) {
      e.stopPropagation();
      e.preventDefault();
      didDrag = false;
    }
  }, true);
}

async function init() {
  setupPanning();
  setupZoom();
  setupHelpButton();
  setupGoalIndexButton();
  setupExamButton();
  if (SHOW_MOTIVATION_BUTTON) setupMotivationButton();
  try {
    const [noderText, eksamenText] = await Promise.all([
      fetchText('noder.csv'),
      fetchText('eksamensoppgaver.csv'),
    ]);

    const noderRows = parseCsv(noderText);
    const eksamenRows = parseCsv(eksamenText);

    buildNodeIndex(noderRows);
    buildExamIndex(eksamenRows);
    validateReferences();
    validateDag();

    renderErrorBanner();
    computeLevels();
    layoutAndRender();
    updateProgressUI();
  } catch (err) {
    console.error('Kunde inte ladda färdighetsträdet:', err);
    validationErrors.push('Kritiskt fel vid inläsning: ' + err.message + ' (kör du sidan via en lokal server? fetch() av CSV-filer misslyckas ofta om man öppnar index.html direkt från disk i webbläsaren.)');
    renderErrorBanner();
  }
}

function fetchText(path) {
  return fetch(path).then(res => {
    if (!res.ok) throw new Error(`Hittade inte ${path} (status ${res.status})`);
    return res.text();
  });
}

function parseCsv(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (result.errors && result.errors.length) {
    result.errors.forEach(e => validationErrors.push(`CSV-fel: ${e.message} (rad ${e.row})`));
  }
  return result.data;
}

/* ------------------------------------------------------------------ */
/* Indeksering av data                                                  */
/* ------------------------------------------------------------------ */

function buildNodeIndex(rows) {
  nodesById = new Map();
  allNodes = [];
  rows.forEach(row => {
    const id = (row.id || '').trim();
    if (!id) return;
    const node = {
      id,
      type: (row.type || '').trim(),
      emne: (row.emne || '').trim() || FALLBACK_TOPIC,
      navn: (row.navn || '').trim(),
      beskrivelse: (row.beskrivelse || '').trim(),
      avhenger_av: (row.avhenger_av || '').split(';').map(s => s.trim()).filter(Boolean),
      hjelpemiddel: (row.hjelpemiddel || '').trim(),
      instruks: (row.instruks || '').trim(),
      children: [],
      nivaa: 0,
      x: 0,
      y: 0,
    };
    nodesById.set(id, node);
    allNodes.push(node);
  });

  allNodes.forEach(node => {
    node.avhenger_av.forEach(depId => {
      const dep = nodesById.get(depId);
      if (dep) dep.children.push(node.id);
    });
  });
}

function buildExamIndex(rows) {
  examsByNode = new Map();
  rows.forEach(row => {
    const nodeId = (row.node_id || '').trim();
    if (!nodeId) return;
    if (!examsByNode.has(nodeId)) examsByNode.set(nodeId, []);
    examsByNode.get(nodeId).push({
      aar: (row.aar || '').trim(),
      sesong: (row.sesong || '').trim(),
      del: (row.del || '').trim(),
      oppgavenummer: (row.oppgavenummer || '').trim(),
      url: (row.url || '').trim(),
    });
  });
}

/* ------------------------------------------------------------------ */
/* Validering                                                           */
/* ------------------------------------------------------------------ */

function validateReferences() {
  allNodes.forEach(node => {
    node.avhenger_av.forEach(depId => {
      if (!nodesById.has(depId)) {
        validationErrors.push(`Noden "${node.id}" refererar till okänt avhenger_av-id "${depId}".`);
      }
    });
    if (node.emne === FALLBACK_TOPIC && !TOPIC_ORDER.includes(FALLBACK_TOPIC)) {
      validationErrors.push(`Noden "${node.id}" saknar "emne" i noder.csv och hamnar i samlekolumnen "${FALLBACK_TOPIC}".`);
    }
  });
  examsByNode.forEach((rows, nodeId) => {
    if (!nodesById.has(nodeId)) {
      validationErrors.push(`eksamensoppgaver.csv refererar till okänt node_id "${nodeId}".`);
    }
  });
}

function validateDag() {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map(allNodes.map(n => [n.id, WHITE]));
  const stack = [];

  function visit(node) {
    color.set(node.id, GRAY);
    stack.push(node.id);
    for (const depId of node.avhenger_av) {
      const dep = nodesById.get(depId);
      if (!dep) continue;
      const c = color.get(dep.id);
      if (c === GRAY) {
        const cycleStart = stack.indexOf(dep.id);
        const cycle = stack.slice(cycleStart).concat(dep.id);
        validationErrors.push(`Cykel upptäckt i avhenger_av: ${cycle.join(' -> ')}`);
      } else if (c === WHITE) {
        visit(dep);
      }
    }
    stack.pop();
    color.set(node.id, BLACK);
  }

  allNodes.forEach(node => {
    if (color.get(node.id) === WHITE) visit(node);
  });
}

function renderErrorBanner() {
  const banner = document.getElementById('error-banner');
  if (!validationErrors.length) {
    banner.classList.remove('visible');
    banner.textContent = '';
    return;
  }
  console.warn('Validering av färdighetsträdet hittade problem:\n' + validationErrors.join('\n'));
  banner.textContent = '⚠ ' + validationErrors.length + ' problem hittades i datafilerna (se konsolen för detaljer):\n' + validationErrors.join('\n');
  banner.classList.add('visible');
}

/* ------------------------------------------------------------------ */
/* Layout: emne-kolonner, lagdelt graf + barycenter innad i hver kolonne */
/* ------------------------------------------------------------------ */

// Grafen deles i én kolonne per "emne" (fagområde). Uten dette havner alle
// noder på samme rad basert på lengste sti fra en rot-node *i hele grafen*,
// slik at helt urelaterte tema (f.eks. prosentregning og statistikk) tvinges
// sammen på de samme radene og gir svært brede, uoversiktlige rader. Med
// kolonner får hvert emne vokse nedover i sitt eget tempo, og brede rader
// innad i en kolonne brytes i tillegg over flere rader (se wrapLevelRows).

function groupByColumn() {
  const columns = new Map();
  allNodes.forEach(node => {
    if (!columns.has(node.emne)) columns.set(node.emne, []);
    columns.get(node.emne).push(node);
  });
  const known = TOPIC_ORDER.filter(t => columns.has(t));
  const unknown = [...columns.keys()]
    .filter(t => !TOPIC_ORDER.includes(t))
    .sort((a, b) => a.localeCompare(b, 'sv'));
  return [...known, ...unknown].map(topic => ({ topic, nodes: columns.get(topic) }));
}

// Nivå per node = lengste sti fra en rot-node i HELE grafen (ikke bare innad i
// kolonnen). Dette er bevisst globalt: hvis f.eks. en node i én kolonne
// avhenger av noe som ligger dypt nede i en annen kolonne, skal hele
// undertreet dens starte tilsvarende langt ned - ikke øverst i sin egen
// kolonne. Kolonner som ikke har noen eksterne avhengigheter starter
// fortsatt øverst (nivå 0), som før.
function computeLevels() {
  const memo = new Map();
  const inProgress = new Set();

  function level(node) {
    if (memo.has(node.id)) return memo.get(node.id);
    if (inProgress.has(node.id)) return 0; // syklus - allerede rapportert av validateDag
    inProgress.add(node.id);
    let lvl = 0;
    node.avhenger_av.forEach(depId => {
      const dep = nodesById.get(depId);
      if (dep) lvl = Math.max(lvl, level(dep) + 1);
    });
    inProgress.delete(node.id);
    memo.set(node.id, lvl);
    return lvl;
  }

  allNodes.forEach(node => {
    node.nivaa = level(node);
  });
}

function assignOrderIndex(row) {
  row.forEach((node, i) => { node.orderIndex = i; });
}

function barycenterSortRow(row, relationField, idsInColumn) {
  row.forEach(node => {
    const related = node[relationField]
      .filter(id => idsInColumn.has(id))
      .map(id => nodesById.get(id))
      .filter(Boolean);
    if (!related.length) {
      node._barycenter = node.orderIndex; // behold posisjon hvis ingen relasjon i denne kolonnen
    } else {
      node._barycenter = related.reduce((s, n) => s + n.orderIndex, 0) / related.length;
    }
  });
  row.sort((a, b) => a._barycenter - b._barycenter);
}

// Hvor mange visuelle rader trengs for `count` noder på ett nivå i én kolonne,
// gitt at en rad brytes når den blir bredere enn LAYOUT.maxNodesPerRow.
function chunksNeeded(count) {
  return count > 0 ? Math.ceil(count / LAYOUT.maxNodesPerRow) : 0;
}

// Radstart (visuell radindeks) per globalt nivå, felles for ALLE kolonner.
//
// `nivaa` beregnes bevisst globalt (se computeLevels) nettopp for at "lenger
// ned i grafen" skal bety det samme uansett kolonne - en node med høyere
// nivaa enn en av sine forutsetninger skal alltid tegnes på samme rad eller
// lenger ned, selv når forutsetningen ligger i en annen kolonne (emne). Hvis
// radbryting (se layoutColumn) kun forskyver rader PER KOLONNE, brytes denne
// garantien: en kolonne med mange noder på et tidlig nivå bryter i flere
// rader og skyver sine egne senere nivåer nedover, mens en tynnere kolonne
// ikke gjør det - da kan en node med lavt nivaa ende visuelt UNDER en node
// med høyere nivaa i en annen kolonne, selv om førstnevnte er en forutsetning
// for sistnevnte (linjen mellom dem peker da "oppover", som er misvisende).
//
// Løsningen: finn, for hvert nivå, det STØRSTE antallet rader noen kolonne
// trenger for det nivået (maks over alle kolonner), og la alle kolonner
// bruke denne samme radstarten per nivå. Tynne kolonner får da tomme
// mellomrom der en annen kolonne trengte flere rader - det er prisen for at
// nivaa fortsatt betyr det samme overalt i kartet.
function computeGlobalRowStarts(columns) {
  const maxLevel = allNodes.reduce((m, n) => Math.max(m, n.nivaa), 0);
  const rowStart = [];
  let cursor = 0;
  for (let lvl = 0; lvl <= maxLevel; lvl++) {
    rowStart.push(cursor);
    let rowsForLevel = 1;
    columns.forEach(({ nodes }) => {
      const count = nodes.filter(n => n.nivaa === lvl).length;
      rowsForLevel = Math.max(rowsForLevel, chunksNeeded(count));
    });
    cursor += rowsForLevel;
  }
  return rowStart;
}

// Legger nodene i én kolonne ut i visuelle rader. Radstart per nivå kommer
// fra `globalRowStart` (se computeGlobalRowStarts) slik at nivåer forblir
// synkronisert på tvers av kolonner selv når enkelte kolonner bryter brede
// rader i flere visuelle rader. Nivåer kolonnen ikke har noen noder på blir
// stående tomme (arrayet får "hull" der), noe som er nettopp poenget: det er
// slik en kolonne med en dyp ekstern avhengighet får luft over seg i stedet
// for å starte helt øverst.
function layoutColumn(nodes, globalRowStart) {
  const idsInColumn = new Set(nodes.map(n => n.id));
  const levelsPresent = [...new Set(nodes.map(n => n.nivaa))].sort((a, b) => a - b);
  const levelRows = new Map();
  levelsPresent.forEach(lvl => levelRows.set(lvl, []));
  nodes.forEach(node => levelRows.get(node.nivaa).push(node));

  // Startrekkefølge: stabil, alfabetisk på navn for et deterministisk utgangspunkt
  levelRows.forEach(row => row.sort((a, b) => a.navn.localeCompare(b.navn, 'sv')));
  levelsPresent.forEach(lvl => assignOrderIndex(levelRows.get(lvl)));

  for (let pass = 0; pass < LAYOUT.barycenterPasses; pass++) {
    const topDown = pass % 2 === 0;
    const order = topDown ? levelsPresent : [...levelsPresent].reverse();
    order.forEach(lvl => barycenterSortRow(levelRows.get(lvl), topDown ? 'avhenger_av' : 'children', idsInColumn));
    levelsPresent.forEach(lvl => assignOrderIndex(levelRows.get(lvl)));
  }

  const visualRows = [];
  levelsPresent.forEach(lvl => {
    const row = levelRows.get(lvl);
    const chunks = [];
    for (let i = 0; i < row.length; i += LAYOUT.maxNodesPerRow) chunks.push(row.slice(i, i + LAYOUT.maxNodesPerRow));
    chunks.forEach((chunk, i) => { visualRows[globalRowStart[lvl] + i] = chunk; });
  });

  return visualRows; // sparse: tomme nivåer/rader gir hull som forEach/reduce hopper over
}

// Bokstav for kolonne nr. `index` (0-basert): A, B, C, ..., Z, AA, AB, ...
// (samme mønster som kolonnenavn i et regneark), i tilfelle et fag skulle få
// flere enn 26 emner.
function columnLetter(index) {
  let n = index;
  let s = '';
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

// Systematisk indeksering av læringsmål: auto-generert, ALDRI lagret i CSV
// (se "Ikke gjør" i instruks.md). Hvert emne (kolonne) får en bokstav, i
// samme rekkefølge som kolonnene vises i kartet (styrt av TOPIC_ORDER - se
// groupByColumn). Innad i hvert emne får hver node et sekvensielt nummer,
// sortert på (nivaa, y, x):
//   - node.nivaa (se computeLevels) er beregnet globalt og garanterer at en
//     forutsetning alltid har lavere nivå enn alt som (direkte eller
//     indirekte) avhenger av den - også når avhengigheten krysser kolonner.
//     Dermed vil et læringsmål alltid få et lavere tall enn det som bygger
//     videre på det, innad i samme emne ("nedover i treet" -> økende tall).
//   - y og x (satt av layoutColumn/layoutAndRender rett før dette kalles) er
//     kun tie-break for et stabilt, lesbart resultat som følger rekkefølgen
//     nodene faktisk vises i kartet (rad for rad, venstre mot høyre).
function assignLearningGoalIndices(columns) {
  themeList = columns.map(({ topic, nodes }, i) => {
    const letter = columnLetter(i);
    const sorted = [...nodes].sort((a, b) => a.nivaa - b.nivaa || a.y - b.y || a.x - b.x);
    sorted.forEach((node, j) => { node.goalIndex = `${letter}${j + 1}`; });
    return { letter, topic, nodes: sorted };
  });
}

function layoutAndRender() {
  const columns = groupByColumn();
  const globalRowStart = computeGlobalRowStarts(columns);
  const columnMeta = [];
  let cursorX = 0;

  columns.forEach(({ topic, nodes }) => {
    const visualRows = layoutColumn(nodes, globalRowStart);
    const colWidthNodes = visualRows.reduce((m, row) => Math.max(m, row.length), 1);
    const colPixelWidth = colWidthNodes * LAYOUT.nodeWidth + Math.max(0, colWidthNodes - 1) * LAYOUT.hGap;

    visualRows.forEach((row, rowIndex) => {
      const rowWidth = row.length * LAYOUT.nodeWidth + Math.max(0, row.length - 1) * LAYOUT.hGap;
      const rowStartX = cursorX + (colPixelWidth - rowWidth) / 2;
      row.forEach((node, i) => {
        node.x = rowStartX + i * (LAYOUT.nodeWidth + LAYOUT.hGap);
        node.y = LAYOUT.columnLabelHeight + rowIndex * (LAYOUT.nodeHeight + LAYOUT.vGap);
      });
    });

    columnMeta.push({ topic, x: cursorX, width: colPixelWidth, rowCount: visualRows.length, nodes });
    cursorX += colPixelWidth + LAYOUT.columnGap;
  });

  const totalWidth = Math.max(0, cursorX - LAYOUT.columnGap) + LAYOUT.padding * 2;
  const maxRowCount = columnMeta.reduce((m, c) => Math.max(m, c.rowCount), 0);
  const totalHeight = LAYOUT.columnLabelHeight
    + maxRowCount * LAYOUT.nodeHeight + Math.max(0, maxRowCount - 1) * LAYOUT.vGap
    + LAYOUT.padding * 2;

  const container = document.getElementById('graph-container');
  container.style.width = totalWidth + 'px';
  container.style.height = totalHeight + 'px';

  assignLearningGoalIndices(columns);
  renderGraph(columnMeta);
}

/* ------------------------------------------------------------------ */
/* Rendering av grafen                                                  */
/* ------------------------------------------------------------------ */

// Viser den svenska visningsteksten for en nodetype ("begrepp"/"färdighet")
// - selve datafeltet node.type holdes uoversatt (begrep/ferdighet) siden det
// er del av den delte datakontrakten på tvers av begge motorene, se "To
// motorer, ett datamodell" i instruks.md.
function typeLabelText(type) {
  return type === 'begrep' ? 'begrepp' : type === 'ferdighet' ? 'färdighet' : type;
}

function renderGraph(columnMeta) {
  const container = document.getElementById('graph-container');
  const nodesLayer = document.getElementById('nodes-layer');
  const headersLayer = document.getElementById('column-headers');
  const bandsLayer = document.getElementById('column-bands');
  const svg = document.getElementById('edges');
  nodesLayer.innerHTML = '';
  headersLayer.innerHTML = '';
  bandsLayer.innerHTML = '';
  svg.innerHTML = '';

  const width = container.clientWidth || parseInt(container.style.width, 10);
  const height = container.clientHeight || parseInt(container.style.height, 10);
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);

  // Bakgrunnsbånd bak hver kolonne, annenhver farge, så det er lett å se hvor
  // ett emne slutter og det neste begynner.
  const bandHeight = height - LAYOUT.padding * 2;
  columnMeta.forEach((col, i) => {
    const band = document.createElement('div');
    band.className = 'column-band' + (i % 2 === 1 ? ' column-band-alt' : '');
    band.style.left = (LAYOUT.padding + col.x - LAYOUT.columnGap / 2) + 'px';
    band.style.top = LAYOUT.padding + 'px';
    band.style.width = (col.width + LAYOUT.columnGap) + 'px';
    band.style.height = bandHeight + 'px';
    bandsLayer.appendChild(band);
  });

  // Kolonneoverskrifter, med snarveier for å merke/fjerne mestret-status for
  // alle noder i temaet samtidig (se bulkSetMastery).
  columnMeta.forEach(col => {
    const header = document.createElement('div');
    header.className = 'column-header';
    header.style.left = (LAYOUT.padding + col.x) + 'px';
    header.style.top = LAYOUT.padding + 'px';
    header.style.width = col.width + 'px';

    const label = document.createElement('span');
    label.className = 'column-header-label';
    label.textContent = col.topic;
    header.appendChild(label);

    const actions = document.createElement('span');
    actions.className = 'column-header-actions';

    const markBtn = document.createElement('button');
    markBtn.type = 'button';
    markBtn.className = 'column-header-btn';
    markBtn.textContent = '✓';
    markBtn.title = `Markera alla färdigheter i «${col.topic}» som avklarade`;
    markBtn.addEventListener('click', () => bulkSetMastery(col.nodes, true));
    actions.appendChild(markBtn);

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'column-header-btn';
    clearBtn.textContent = '✕';
    clearBtn.title = `Ta bort avklarad-markering för alla färdigheter i «${col.topic}»`;
    clearBtn.addEventListener('click', () => bulkSetMastery(col.nodes, false));
    actions.appendChild(clearBtn);

    header.appendChild(actions);
    headersLayer.appendChild(header);
  });

  const progress = getProgress();

  // Kanter
  allNodes.forEach(node => {
    node.avhenger_av.forEach(depId => {
      const dep = nodesById.get(depId);
      if (!dep) return;
      const x1 = LAYOUT.padding + dep.x + LAYOUT.nodeWidth / 2;
      const y1 = LAYOUT.padding + dep.y + LAYOUT.nodeHeight;
      const x2 = LAYOUT.padding + node.x + LAYOUT.nodeWidth / 2;
      const y2 = LAYOUT.padding + node.y;
      const midY = (y1 + y2) / 2;
      const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      if (isNodeMastered(dep, progress) && isNodeMastered(node, progress)) {
        path.classList.add('edge-active');
      }
      svg.appendChild(path);
    });
  });

  // Noder
  allNodes.forEach(node => {
    nodesLayer.appendChild(createNodeElement(node, progress));
  });
}

function createNodeElement(node, progress) {
  const el = document.createElement('div');
  el.className = `node-box type-${node.type}`;
  el.style.left = (LAYOUT.padding + node.x) + 'px';
  el.style.top = (LAYOUT.padding + node.y) + 'px';
  el.style.width = LAYOUT.nodeWidth + 'px';
  el.style.minHeight = LAYOUT.nodeHeight + 'px';
  el.dataset.nodeId = node.id;

  const mastered = isNodeMastered(node, progress);
  const available = isAvailable(node, progress);
  if (mastered) el.classList.add('mastered');
  if (!available && !mastered) el.classList.add('locked');
  if (node.id === activeNodeId) el.classList.add('active');

  const topRow = document.createElement('div');
  topRow.className = 'node-top-row';

  const name = document.createElement('div');
  name.className = 'node-name';
  const indexSpan = document.createElement('span');
  indexSpan.className = 'node-index';
  indexSpan.textContent = node.goalIndex + ') ';
  name.appendChild(indexSpan);
  name.appendChild(document.createTextNode(node.navn));
  topRow.appendChild(name);

  el.appendChild(topRow);

  const entry = progress[node.id] || {};

  const meta = document.createElement('div');
  meta.className = 'node-meta';

  const metaLeft = document.createElement('div');
  metaLeft.className = 'node-meta-left';
  if (SHOW_HJELPEMIDDEL) metaLeft.appendChild(makeHjelpemiddelBadge(node.hjelpemiddel));
  const typeLabel = document.createElement('span');
  typeLabel.className = 'badge-type';
  typeLabel.textContent = typeLabelText(node.type);
  metaLeft.appendChild(typeLabel);
  meta.appendChild(metaLeft);

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'node-checkbox';
  checkbox.checked = !!entry.mastered;
  checkbox.title = 'Markera som avklarad';
  checkbox.addEventListener('click', e => e.stopPropagation());
  checkbox.addEventListener('change', () => setNodeProgress(node.id, 'mastered', checkbox.checked));
  meta.appendChild(checkbox);

  el.appendChild(meta);

  el.addEventListener('click', () => openDetail(node.id));

  return el;
}

function createMasteryToggle(labelText, checked, onChange) {
  const label = document.createElement('label');
  label.className = 'mastered-toggle';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = !!checked;
  input.addEventListener('change', () => onChange(input.checked));
  label.appendChild(input);
  label.appendChild(document.createTextNode(labelText));
  return label;
}

function makeHjelpemiddelBadge(value) {
  const span = document.createElement('span');
  span.className = 'badge ' + (
    value === 'del1' ? 'badge-del1' : value === 'del2' ? 'badge-del2' : 'badge-begge'
  );
  span.textContent = value === 'del1' ? 'Del 1' : value === 'del2' ? 'Del 2' : 'Del 1+2';
  return span;
}

/* ------------------------------------------------------------------ */
/* Progresjon / localStorage                                            */
/* ------------------------------------------------------------------ */

// Alle noder (ferdighet og begrep) har én avkrysning: mestret eller ikke.
// Lagringsformat per node-id: { mastered: bool }.

function getProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch (e) {
    return {};
  }
}

function setProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function setNodeProgress(nodeId, key, value) {
  const progress = getProgress();
  const entry = progress[nodeId] || {};
  entry[key] = value;
  progress[nodeId] = entry;
  setProgress(progress);
  refreshAfterProgressChange();
}

// Setter mestret-status for flere noder samtidig (brukt av "marker/fjern
// alle"-knappene i kolonneoverskriften), med kun én render/lagring til slutt.
function bulkSetMastery(nodes, mastered) {
  const progress = getProgress();
  nodes.forEach(node => {
    const entry = progress[node.id] || {};
    entry.mastered = mastered;
    progress[node.id] = entry;
  });
  setProgress(progress);
  refreshAfterProgressChange();
}

function isNodeMastered(node, progress) {
  const entry = progress[node.id];
  return !!(entry && entry.mastered);
}

function isAvailable(node, progress) {
  if (!node.avhenger_av.length) return true;
  return node.avhenger_av.every(depId => {
    const dep = nodesById.get(depId);
    return dep && isNodeMastered(dep, progress);
  });
}

function refreshAfterProgressChange() {
  layoutAndRender();
  updateProgressUI();
  if (activeNodeId) renderDetail(nodesById.get(activeNodeId));
}

function updateProgressUI() {
  const progress = getProgress();
  const total = allNodes.length;
  const done = allNodes.filter(n => isNodeMastered(n, progress)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `${done} av ${total} färdigheter avklarade`;
}

/* ------------------------------------------------------------------ */
/* Forfedre / KI-instruks-komposisjon                                   */
/* ------------------------------------------------------------------ */

function getAllAncestors(node) {
  const visited = new Set();
  const result = [];

  function visit(n) {
    n.avhenger_av.forEach(depId => {
      if (visited.has(depId)) return;
      visited.add(depId);
      const dep = nodesById.get(depId);
      if (!dep) return;
      visit(dep);
      result.push(dep);
    });
  }

  visit(node);
  return result;
}

// Hjelpemiddel-konteksten (del1/del2/begge) er faglig innhold - hvert fag
// definerer selv teksten i config.js (composeHjelpemiddelContext), siden
// hva "hjelpemidler" betyr og hvilke regler som gjelder varierer per fag.
function composeHjelpemiddelContext(hjelpemiddel) {
  if (typeof CONFIG.composeHjelpemiddelContext === 'function') {
    return CONFIG.composeHjelpemiddelContext(hjelpemiddel);
  }
  const labels = { del1: 'del 1', del2: 'del 2', begge: 'del 1 och del 2' };
  return `Hjälpmedel: Detta gäller ${labels[hjelpemiddel] || 'provet'}.`;
}

function composeInstruction(node) {
  const parts = [];
  parts.push(AI_INSTRUCTION_TEMPLATE);

  const ancestors = getAllAncestors(node);
  if (ancestors.length) {
    const names = ancestors.map(a => `- ${a.navn}`).join('\n');
    parts.push(`Eleven ska sedan tidigare behärska följande förkunskaper:\n${names}`);
  } else {
    parts.push('Denna nod har inga förkunskaper registrerade i färdighetsträdet - anta att eleven är helt ny inför detta begrepp/denna färdighet.');
  }

  parts.push(`Målet för passet är att eleven ska lära sig följande: "${node.navn}". Texten nedan beskriver vad det innebär att bemästra noden - det är målet för passet, inte något eleven redan kan:\n${node.beskrivelse}`);

  if (node.type === 'begrep') {
    parts.push(BEGREP_TEST_GUIDANCE);
  }

  if (node.instruks) {
    parts.push(node.instruks);
  }

  if (SHOW_HJELPEMIDDEL) {
    parts.push(composeHjelpemiddelContext(node.hjelpemiddel));
  }

  return parts.join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Detaljpanel                                                          */
/* ------------------------------------------------------------------ */

function scrollNodeIntoView(nodeId) {
  const el = document.querySelector(`.node-box[data-node-id="${nodeId}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  el.classList.remove('highlight-pulse');
  void el.offsetWidth; // tving reflow, slik at animasjonen kan starte på nytt ved gjentatte klikk
  el.classList.add('highlight-pulse');
  setTimeout(() => el.classList.remove('highlight-pulse'), 1600);
}

function openDetail(nodeId) {
  activeNodeId = nodeId;
  document.querySelectorAll('.node-box').forEach(el => {
    el.classList.toggle('active', el.dataset.nodeId === nodeId);
  });
  document.getElementById('detail-panel').classList.add('open');
  renderDetail(nodesById.get(nodeId));
}

function closeDetail() {
  activeNodeId = null;
  document.getElementById('detail-panel').classList.remove('open');
  document.querySelectorAll('.node-box.active').forEach(el => el.classList.remove('active'));
}

function renderDetail(node) {
  if (!node) return;
  const inner = document.getElementById('detail-panel-inner');
  const progress = getProgress();
  const entry = progress[node.id] || {};
  const mastered = isNodeMastered(node, progress);
  const available = isAvailable(node, progress);
  const ancestors = getAllAncestors(node);
  const exams = examsByNode.get(node.id) || [];

  inner.innerHTML = '';

  const closeBtn = document.createElement('button');
  closeBtn.id = 'detail-close';
  closeBtn.textContent = '✕ stäng';
  closeBtn.addEventListener('click', closeDetail);
  inner.appendChild(closeBtn);

  const h2 = document.createElement('h2');
  h2.textContent = `${node.goalIndex}) ${node.navn}`;
  inner.appendChild(h2);

  const meta = document.createElement('div');
  meta.id = 'detail-meta';
  if (SHOW_HJELPEMIDDEL) meta.appendChild(makeHjelpemiddelBadge(node.hjelpemiddel));
  const typeBadge = document.createElement('span');
  typeBadge.className = 'badge-type';
  typeBadge.textContent = typeLabelText(node.type);
  meta.appendChild(typeBadge);
  inner.appendChild(meta);

  const status = document.createElement('div');
  status.id = 'detail-status';
  status.textContent = mastered
    ? '✓ Avklarad'
    : available
      ? 'Tillgänglig — förkunskaperna är uppfyllda'
      : 'Låst — förkunskaper saknas';
  if (available && !mastered) status.classList.add('available');
  inner.appendChild(status);

  const toggles = document.createElement('div');
  toggles.className = 'mastery-toggles';
  toggles.appendChild(createMasteryToggle('Markera som avklarad', entry.mastered, checked => setNodeProgress(node.id, 'mastered', checked)));
  inner.appendChild(toggles);

  const desc = document.createElement('p');
  desc.id = 'detail-desc';
  desc.textContent = node.beskrivelse;
  inner.appendChild(desc);

  if (ancestors.length) {
    const h3 = document.createElement('div');
    h3.className = 'badge-type';
    h3.style.marginBottom = '0.4rem';
    h3.textContent = 'Förkunskaper';
    inner.appendChild(h3);
    const ul = document.createElement('ul');
    ul.className = 'prereq-list';
    ancestors.forEach(a => {
      const li = document.createElement('li');
      const aMastered = isNodeMastered(a, progress);
      li.className = 'prereq-item' + (aMastered ? ' prereq-item-done' : '');
      const check = document.createElement('span');
      check.className = 'prereq-check';
      check.textContent = aMastered ? '✓' : '○';
      check.title = aMastered ? 'Avklarad' : 'Inte avklarad än';
      li.appendChild(check);
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'prereq-link';
      link.textContent = a.navn;
      link.addEventListener('click', () => {
        openDetail(a.id);
        scrollNodeIntoView(a.id);
      });
      li.appendChild(link);
      ul.appendChild(li);
    });
    inner.appendChild(ul);
  }

  const actions = document.createElement('div');
  actions.className = 'instruction-actions';

  const showBtn = document.createElement('button');
  showBtn.className = 'btn secondary';
  showBtn.textContent = 'Visa AI-instruktion';
  actions.appendChild(showBtn);

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn';
  copyBtn.textContent = 'Kopiera AI-instruktion';
  actions.appendChild(copyBtn);

  inner.appendChild(actions);

  const textarea = document.createElement('textarea');
  textarea.id = 'instruction-text';
  textarea.readOnly = true;
  const instructionText = composeInstruction(node);
  textarea.value = instructionText;
  inner.appendChild(textarea);

  showBtn.addEventListener('click', () => {
    const visible = textarea.classList.toggle('visible');
    showBtn.textContent = visible ? 'Dölj AI-instruktion' : 'Visa AI-instruktion';
  });

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(instructionText).then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = 'Kopierat!';
      setTimeout(() => { copyBtn.textContent = original; }, 1500);
    }).catch(() => {
      textarea.classList.add('visible');
      textarea.select();
    });
  });

  if (exams.length) {
    const h3 = document.createElement('div');
    h3.className = 'badge-type';
    h3.style.margin = '1.4rem 0 0.4rem';
    h3.textContent = 'Provuppgifter';
    inner.appendChild(h3);

    const ul = document.createElement('ul');
    ul.className = 'exam-list';
    exams.forEach(exam => {
      const li = document.createElement('li');
      const label = `${capitalize(exam.sesong)} ${exam.aar}, del ${exam.del}, uppgift ${exam.oppgavenummer}`;
      if (exam.url) {
        const a = document.createElement('a');
        a.href = exam.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = label;
        li.appendChild(a);
      } else {
        li.textContent = label;
      }
      ul.appendChild(li);
    });
    inner.appendChild(ul);
  }
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
