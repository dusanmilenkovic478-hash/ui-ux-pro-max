document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var list = document.querySelector('.nav__list');
  if (!toggle || !list) return;

  toggle.addEventListener('click', function () {
    var isOpen = list.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  list.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      list.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var track = slider.querySelector('.photo-slider__track');
    var slides = slider.querySelectorAll('.photo-slider__slide');
    var dotsWrap = slider.querySelector('.photo-slider__dots');
    if (slides.length <= 1) return;
    var index = 0;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'photo-slider__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Bild ' + (i + 1) + ' von ' + slides.length);
      dot.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.querySelectorAll('.photo-slider__dot');

    function go(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (d, di) { d.classList.toggle('is-active', di === index); });
    }

    slider.querySelector('.photo-slider__nav--prev').addEventListener('click', function () { go(index - 1); });
    slider.querySelector('.photo-slider__nav--next').addEventListener('click', function () { go(index + 1); });
  });

  var finder = document.querySelector('[data-finder]');
  if (finder) {
    var progressWrap = finder.querySelector('[data-progress]');
    var slot = finder.querySelector('[data-question-slot]');
    var resultEl = finder.querySelector('[data-result]');
    var TOTAL_STEPS = 6;
    var answers = {};
    var historyStack = [];

    var icons = {
      zelt: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l9 16H3z"/><path d="M12 4v16"/></svg>',
      camper: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="13" height="8" rx="1.5"/><path d="M16 12h3l2 2.5V18h-5z"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="17" cy="18.5" r="1.5"/></svg>',
      airbnb: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>'
    };

    var questions = {
      standort: {
        key: 'standort',
        title: 'Soll die Maßnahme eher in der Stadt oder auf dem Land stattfinden?',
        options: [
          { label: 'Eher städtisches Umfeld', value: 'Stadt', next: 'betreuung' },
          { label: 'Eher ländliches Umfeld, viel Natur', value: 'Land', next: 'betreuung' }
        ]
      },
      betreuung: {
        key: 'betreuung',
        title: 'Soll die Maßnahme im Team oder in fester Einzelbetreuung laufen?',
        options: [
          { label: 'Mehrköpfiges Betreuungsteam', value: 'Team', next: 'ressourceEinsatz' },
          { label: 'Feste 1:1-Einzelbetreuung', value: 'Einzelbetreuung', next: 'ressourceEinsatz' }
        ]
      },
      ressourceEinsatz: {
        key: 'ressourceEinsatz',
        title: 'Passt der Einsatz einer eigenen Ressource aktuell?',
        options: [
          { label: 'Ja, eine eigene Ressource passt', value: 'ja', next: 'ressource' },
          { label: 'Eher nein — Unterkunft vor Ort planen', value: 'nein', next: 'unterkunft' }
        ]
      },
      ressource: {
        key: 'ressource',
        title: 'Welche Ressource passt am besten?',
        options: [
          { label: 'Marinele — Binnenschiff auf Weser und Elbe', value: 'Marinele', next: 'buero' },
          { label: 'KIM-Mobil — flexibel und kurzfristig einsetzbar', value: 'KIM-Mobil', next: 'buero' },
          { label: 'Potosi — Segelschiff, saisonale Charter-Fenster', value: 'Potosi', next: 'buero' }
        ]
      },
      unterkunft: {
        key: 'unterkunft',
        title: 'Welche Unterkunft soll gebucht werden?',
        options: [
          { label: 'Zelt', value: 'Zelt', next: 'buero' },
          { label: 'Camper', value: 'Camper', next: 'buero' },
          { label: 'Airbnb / Ferienwohnung', value: 'Airbnb', next: 'buero' }
        ]
      },
      buero: {
        key: 'buero',
        title: 'Soll die Maßnahme in der Nähe unseres Büros starten, damit das multiprofessionelle Team mitwirken kann?',
        options: [
          { label: 'Ja, Nähe zum Büro ist wichtig', value: 'ja', next: 'kjp' },
          { label: 'Nein, der Standort ist unabhängig vom Büro', value: 'nein', next: 'kjp' }
        ]
      },
      kjp: {
        key: 'kjp',
        title: 'Muss eine Kinder- und Jugendpsychiatrie (KJP) eingebunden werden?',
        options: [
          { label: 'Ja, KJP-Anbindung ist erforderlich', value: 'ja', next: 'result' },
          { label: 'Nein, aktuell nicht erforderlich', value: 'nein', next: 'result' }
        ]
      }
    };

    var resourceInfo = {
      'Marinele': {
        image: 'assets/photos/marinele-2.jpg',
        text: 'Das eigene Binnenschiff auf Weser und Elbe passt, wenn Alltagsstruktur, gemeinsames Kochen und Selbstorganisation im Vordergrund stehen.',
        anchor: 'konzept.html#marinele'
      },
      'KIM-Mobil': {
        image: 'assets/photos/kim-mobil-1.jpg',
        text: 'Das Kriseninterventionsmobil mit getrennten Schlafkabinen ist flexibel und kurzfristig einsetzbar, auch ohne langen Vorlauf.',
        anchor: 'konzept.html#kim-mobil'
      },
      'Potosi': {
        image: 'assets/photos/potosi-1.jpg',
        text: 'Das Segelschiff Potosi wird rund viermal im Jahr gechartert und bietet maximale Distanz zum bisherigen Umfeld.',
        anchor: 'konzept.html#potosi'
      }
    };

    var unterkunftInfo = {
      'Zelt': { icon: icons.zelt, text: 'Für kurze, wetterunabhängig geplante Aufenthalte mit hohem Naturbezug.' },
      'Camper': { icon: icons.camper, text: 'Flexibel und mobil, wenn im Verlauf der Maßnahme unterschiedliche Standorte sinnvoll sind.' },
      'Airbnb': { icon: icons.airbnb, text: 'Wenn vor Ort eine feste, private Unterkunftsbasis gebraucht wird.' }
    };

    function renderProgress(doneCount) {
      progressWrap.innerHTML = '';
      for (var i = 0; i < TOTAL_STEPS; i++) {
        var dot = document.createElement('span');
        dot.className = 'finder__progress-step' + (i < doneCount ? ' is-done' : '');
        progressWrap.appendChild(dot);
      }
    }

    function renderQuestion(id) {
      var q = questions[id];
      var stepIndex = historyStack.length;
      renderProgress(stepIndex);

      var html = '<p class="finder__question-count">Frage ' + (stepIndex + 1) + ' von ' + TOTAL_STEPS + '</p>';
      html += '<h3 class="finder__question-title">' + q.title + '</h3>';
      html += '<div class="finder__options">';
      q.options.forEach(function (opt, i) {
        html += '<button type="button" class="finder__option" data-opt-index="' + i + '">' + opt.label + '</button>';
      });
      html += '</div>';
      if (historyStack.length > 0) {
        html += '<a href="#" class="finder__back" data-back>← Zurück</a>';
      }
      slot.innerHTML = html;

      slot.querySelectorAll('.finder__option').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var opt = q.options[parseInt(btn.getAttribute('data-opt-index'), 10)];
          answers[q.key] = opt.value;
          historyStack.push(id);
          if (opt.next === 'result') {
            showResult();
          } else {
            renderQuestion(opt.next);
          }
        });
      });

      var back = slot.querySelector('[data-back]');
      if (back) {
        back.addEventListener('click', function (e) {
          e.preventDefault();
          var prevId = historyStack.pop();
          renderQuestion(prevId);
        });
      }
    }

    function showResult() {
      slot.classList.remove('is-active');
      renderProgress(TOTAL_STEPS);

      var usesResource = answers.ressourceEinsatz === 'ja';
      var main = usesResource
        ? { title: answers.ressource, info: resourceInfo[answers.ressource], kind: 'ressource' }
        : { title: answers.unterkunft, info: unterkunftInfo[answers.unterkunft], kind: 'unterkunft' };

      var mediaHtml = usesResource
        ? '<img class="finder__result-image" src="' + main.info.image + '" alt="' + main.title + '">'
        : '<div class="finder__result-icon">' + main.info.icon + '</div>';

      var summaryRows = [
        ['Standort', answers.standort],
        ['Betreuungsmodell', answers.betreuung],
        [usesResource ? 'Ressource' : 'Unterkunft', main.title],
        ['Start in Büronähe', answers.buero === 'ja' ? 'Ja' : 'Nein'],
        ['KJP-Einbindung', answers.kjp === 'ja' ? 'Ja' : 'Nein']
      ];
      var summaryHtml = '<div class="finder__summary">' + summaryRows.map(function (row) {
        return '<div class="finder__summary-row"><span class="finder__summary-label">' + row[0] + '</span><span class="finder__summary-value">' + row[1] + '</span></div>';
      }).join('') + '</div>';

      resultEl.innerHTML =
        '<div class="finder__result-grid">' +
          mediaHtml +
          '<div>' +
            '<p class="finder__result-label">Empfehlung</p>' +
            '<h3 class="mt-0">' + main.title + '</h3>' +
            '<p>' + main.info.text + '</p>' +
          '</div>' +
        '</div>' +
        summaryHtml +
        '<div class="finder__result-actions">' +
          (usesResource ? '<a class="btn btn--primary" href="' + main.info.anchor + '">Mehr zu ' + main.title + '</a>' : '') +
          '<a class="btn ' + (usesResource ? 'btn--outline-dark' : 'btn--primary') + '" href="kontakt.html">Fall besprechen</a>' +
        '</div>' +
        '<a href="#" class="finder__restart" data-restart>↺ Noch einmal von vorn</a>';

      resultEl.classList.add('is-active');

      resultEl.querySelector('[data-restart]').addEventListener('click', function (e) {
        e.preventDefault();
        answers = {};
        historyStack = [];
        resultEl.classList.remove('is-active');
        resultEl.innerHTML = '';
        slot.classList.add('is-active');
        renderQuestion('standort');
      });
    }

    renderQuestion('standort');
  }
});
