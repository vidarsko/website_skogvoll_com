(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function blankLine() {
    return new docx.Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: { style: docx.BorderStyle.SINGLE, size: 4, color: 'AAAAAA' }
      },
      children: [new docx.TextRun({ text: ' ' })]
    });
  }

  function fieldLine(label) {
    return new docx.Paragraph({
      spacing: { after: 240 },
      children: [
        new docx.TextRun({ text: label + ': ', bold: true }),
        new docx.TextRun({ text: ' '.repeat(6) + '_'.repeat(46) })
      ]
    });
  }

  function title(text) {
    return new docx.Paragraph({
      heading: docx.HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [new docx.TextRun({ text: text, bold: true })]
    });
  }

  function draftNote() {
    return new docx.Paragraph({
      spacing: { after: 360 },
      children: [
        new docx.TextRun({
          text: 'Del av et internt utkast til revidert vurderingsveiledning for masteroppgaven ved MN-fakultetet, UiO — ikke gjeldende praksis.',
          italics: true,
          color: '666666',
          size: 20
        })
      ]
    });
  }

  function groupHeader(text) {
    return new docx.Paragraph({
      spacing: { before: 300, after: 160 },
      children: [
        new docx.TextRun({ text: text.toUpperCase(), bold: true, size: 20, color: '555555' })
      ]
    });
  }

  function categoryBlock(name, question, questionLabel) {
    var children = [
      new docx.Paragraph({
        spacing: { after: 80 },
        children: [new docx.TextRun({ text: name, bold: true, size: 24 })]
      })
    ];
    if (question) {
      children.push(new docx.Paragraph({
        spacing: { after: 160 },
        children: [new docx.TextRun({ text: (questionLabel || '') + question, italics: !questionLabel, color: '555555' })]
      }));
    }
    children.push(blankLine());
    children.push(blankLine());
    children.push(blankLine());
    return children;
  }

  function download(doc, filename, button) {
    var original = button.textContent;
    button.disabled = true;
    button.textContent = 'Genererer …';
    docx.Packer.toBlob(doc).then(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      button.textContent = original;
      button.disabled = false;
    }).catch(function (err) {
      console.error(err);
      button.textContent = 'Noe gikk feil — forsøk igjen';
      button.disabled = false;
    });
  }

  var MASTEROPPGAVEN_GROUPS = [
    {
      title: 'Gruppe 1 · høyest vekt',
      items: [
        ['Arbeidet', 'Arbeidet viser kreativitet og bidrar til nytenkning eller nyskapning. Det er av betydelig omfang, og resultatene representerer ny kunnskap av god kvalitet og betydning for fagfeltet.'],
        ['Analyse og diskusjon', 'Analyse, fortolkning og diskusjon er faglig fundert, begrunnet og tydelig koblet til problemstillingen. Diskusjonen ligger på et høyt faglig nivå, og kandidaten anvender sine kunnskaper og ferdigheter på nye områder og plasserer resultatene i en større sammenheng. Påstander underbygges med konkrete eksempler, data eller referanser.'],
        ['Kritisk refleksjon', 'Kandidaten gir en rimelig vurdering av betydningen av resultatene og forholder seg kritisk til ulike informasjonskilder. Usikkerhetsmomenter som metode- og målefeil er vurdert og diskutert, og relevante fag-, yrkes- og forskningsetiske problemstillinger er analysert. Faktapåstander er etterprøvbare og underbygget med relevante kilder.'],
        ['Eget bidrag og måloppnåelse', 'Kandidaten skiller klart eget bidrag fra andres. Arbeidet har en konklusjon som oppsummerer resultatene og vurderer i hvilken grad målene er nådd. Det foreligger et fornuftig og begrunnet forslag til videre undersøkelser.']
      ]
    },
    {
      title: 'Gruppe 2',
      items: [
        ['Faglig forankring', 'Det teoretiske og faglige grunnlaget er godt beskrevet, slik at arbeidet plasseres i fagfeltets internasjonale forskning.'],
        ['Teoretisk innsikt', 'Oppgaven, og særlig innledningen, dokumenterer at kandidaten har avansert kunnskap om fagfeltets teori og metoder generelt, og spesialisert innsikt i et avgrenset område av særlig betydning for oppgaven. Sentrale begreper defineres presist og brukes konsekvent gjennom hele arbeidet.'],
        ['Målbeskrivelse', 'Mål og eventuelle hypoteser er presentert på en klar og forståelig måte.']
      ]
    },
    {
      title: 'Gruppe 3',
      items: [
        ['Struktur', 'Arbeidet har en stringent oppbygning (normalt IMRaD: Introduction, Methods, Results and Discussion) og er oversiktlig. Teksten har en tydelig rød tråd der hver del bygger logisk på det foregående, og overganger viser hvordan delene henger sammen.'],
        ['Språk', 'Kandidaten presenterer problemstilling og resultater med faglig presisjon, og språket er korrekt og godt lesbart. Teksten er skrevet for fagfeller, men gir tilstrekkelig forklaring til at en informert leser kan følge argumentet. Setninger og avsnitt er formulert slik at hovedpoengene er lette å identifisere, og nødvendig fagspråk brukes uten unødig kompliserte formuleringer. Teksten er ikke lengre enn formålet tilsier, og unngår fyllstoff og gjentakelser. Tonen er jevn, og begreper, stilnivå og skriveperspektiv holdes konsekvent gjennom arbeidet.'],
        ['Form', 'Det er benyttet en enhetlig stil for referanser, figurer og tabeller. Kvaliteten på figurer og tabeller er tilfredsstillende, og kandidaten behersker fagområdets uttrykksformer.']
      ]
    },
    {
      title: 'Gruppe 4 · lavest vekt',
      items: [
        ['Ferdighetsnivå', 'Kandidaten behersker relevante metoder og bruker dem i eget arbeid på en hensiktsmessig og integrert måte.']
      ]
    }
  ];

  var VEILEDER_ITEMS = [
    ['Arbeidet', 'Hvor omfattende har arbeidet vært, og har kandidaten møtt og løst uforutsette faglige utfordringer underveis?'],
    ['Teoretisk innsikt og eget bidrag', 'Hvordan har kandidatens forståelse av fagfeltet utviklet seg gjennom prosjektet, og hva er kandidatens eget bidrag slik veileder har observert det?'],
    ['Ferdighetsnivå', 'I hvilken grad behersker kandidaten de metodene og verktøyene prosjektet har krevd?'],
    ['Arbeidsform', 'Hvordan har kandidaten organisert og gjennomført arbeidet — planmessig og systematisk, eller mer ad hoc?'],
    ['Arbeidsinnsats', 'Hvor mye tid og innsats har kandidaten lagt ned, sammenlignet med hva som er forventet for et prosjekt av dette omfanget?'],
    ['Selvstendighet', 'I hvilken grad har kandidaten arbeidet selvstendig, og i hvilken grad har hen vært avhengig av tett oppfølging?'],
    ['Progresjon', 'Har fremdriften vært jevn gjennom prosjektperioden, eller preget av perioder med stillstand og innhenting?']
  ];

  var STUDENT_ITEMS = [
    ['Arbeidsprosessen', 'Hvordan har du organisert og gjennomført arbeidet ditt gjennom prosjektperioden?'],
    ['Samarbeidet med veileder', 'Hvordan har veiledningen fungert, og hva har du fått ut av den?'],
    ['Utfordringer og læring', 'Hvilke faglige eller praktiske utfordringer har du møtt underveis, og hvordan løste du dem?'],
    ['Selvstendighet', 'På hvilke områder har du jobbet selvstendig, og hvor har du vært avhengig av støtte?'],
    ['Eget bidrag', 'Hva anser du som ditt viktigste faglige bidrag i prosjektet?']
  ];

  function buildMasteroppgaveDoc() {
    var children = [
      title('Kriterietabell for masteroppgaven — vurderingsskjema'),
      draftNote(),
      fieldLine('Kandidat'),
      fieldLine('Oppgavetittel'),
      fieldLine('Sensorer'),
      fieldLine('Dato')
    ];
    MASTEROPPGAVEN_GROUPS.forEach(function (group) {
      children.push(groupHeader(group.title));
      group.items.forEach(function (item) {
        children = children.concat(categoryBlock(item[0], item[1], 'Tegn på høy måloppnåelse: '));
      });
    });
    return new docx.Document({ sections: [{ children: children }] });
  }

  function buildVeilederDoc() {
    var children = [
      title('Veileders vurdering av prosessen — skjema'),
      draftNote(),
      fieldLine('Kandidat'),
      fieldLine('Oppgavetittel'),
      fieldLine('Veileder(e)'),
      fieldLine('Dato')
    ];
    VEILEDER_ITEMS.forEach(function (item) {
      children = children.concat(categoryBlock(item[0], item[1]));
    });
    return new docx.Document({ sections: [{ children: children }] });
  }

  function buildStudentDoc() {
    var children = [
      title('Studentens vurdering av prosessen — skjema'),
      draftNote(),
      fieldLine('Kandidat'),
      fieldLine('Oppgavetittel'),
      fieldLine('Dato')
    ];
    STUDENT_ITEMS.forEach(function (item) {
      children = children.concat(categoryBlock(item[0], item[1]));
    });
    return new docx.Document({ sections: [{ children: children }] });
  }

  var BUILDERS = {
    masteroppgaven: { build: buildMasteroppgaveDoc, filename: 'kriterietabell-masteroppgaven.docx' },
    veileder: { build: buildVeilederDoc, filename: 'veileders-vurdering.docx' },
    student: { build: buildStudentDoc, filename: 'studentens-vurdering.docx' }
  };

  ready(function () {
    var buttons = document.querySelectorAll('[data-docx]');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var entry = BUILDERS[button.getAttribute('data-docx')];
        if (!entry) return;
        download(entry.build(), entry.filename, button);
      });
    });
  });
})();
