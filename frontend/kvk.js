import { gbi, gbody, vertragingsPromise, nodeVerzameling, toonVerbergElementen } from './nuts.js';
import { pakMarxCitaat } from './ongein.js';
import { huidigeFaillissementen } from './index.js';

/**
 * Event voor 'KvK Paneel' in marker
 * @param {*} faillissementen
 */
export function zetKvKKnopEvent (faillissementen) {
  gbody().addEventListener('click', function (e) {
    const knop = e.target;

    if (!knop.classList.contains('open-kvk')) {
      return;
    }
    const openStreetMapId = knop.getAttribute('data-osm-id');
    knop.setAttribute('disabled', true);

    const faillissementAdresObj = faillissementen.find((f) => f.osm_id === openStreetMapId);

    if (!faillissementAdresObj) {
      alert('ik kon geen kvk nummer vinden. Of tenminste, me algoritme niet. Lag niet aan mij dus.😴');
      return;
    }

    haalKvkInfoEnPrint(faillissementAdresObj.kvk[0], true, faillissementAdresObj.kvk);
    huidigeFaillissementen.zetHuidigeFaillissement(faillissementAdresObj);

    //data-osm-id

    ;
  });
}

export function haalKvkInfoEnPrintOud (kvkNummer, geheelNieuw = false, kvkNummers = []) {
  if (!geheelNieuw) {
    gbi('kvk-resultaat').classList.add('ladend');
  }

  gbi('sluit-kvk-paneel').setAttribute('title', pakMarxCitaat());

  //#region axios kvk
  const url = `https://zoeken.kvk.nl/search.ashx?handelsnaam=&kvknummer=${kvkNummer}&straat=&postcode=&huisnummer=&plaats=&hoofdvestiging=1&rechtspersoon=1&nevenvestiging=1&zoekvervallen=0&zoekuitgeschreven=1&start=0&error=false&searchfield=uitgebreidzoeken&_=1589332056667`;
  axios.get(url).then((kvkResponse) => {
    setTimeout(() => {
      //disabled van knop afhalen

      const dis = document.querySelector('.open-kvk[disabled]');
      if (dis) {
        dis.removeAttribute('disabled');
      }
    }, 500);

    verwerkKvKHTML(kvkResponse.data, 'nummers', url);

    if (kvkNummers.length > 1) {
      gbi('kvk-resultaat-nummers').classList.add('heeft-kvk-nummers-lijst');
    } else {
      gbi('kvk-resultaat-nummers').classList.remove('heeft-kvk-nummers-lijst');
    }

    if (geheelNieuw) {
      if (kvkNummers.length > 1) {
        gbi('kvk-nummers').classList.remove('weg');
        gbi('kvk-nummers').innerHTML = `
          <li>KVK 🕵️‍♂️</li>
        ${kvkNummers
          .map((kvkNr) => {
            return `<li><button class='knopje' class='wissel-kvk' data-kvk-nr='${kvkNr}'>${kvkNr}</button></li>`;
          })
          .join('')}`;
      } else {
        gbi('kvk-nummers').classList.add('weg');
        gbi('kvk-nummers').classList;
      }

      gbi('kvk-paneel').classList.add('groot');
      setTimeout(function () {
        gbi('kvk-paneel').classList.add('open');
      }, 350);
      setTimeout(function () {
        gbi('kvk-paneel').classList.remove('groot');
      }, 450);
    } // eind geheel nieuw
    else {
      gbi('kvk-resultaat-nummers').classList.remove('ladend');
    }
  }); // eind then exios KVK
  // #endregion axiosvk
}

/**
 * navigatie aan de linkerkant van kvk paneel
 * roept mogelijk callback aan
 */
export function zetKvkBladNavigatie () {
  gbody().addEventListener('click', function (e) {
    const knop = e.target;
    if (!knop.classList.contains('kvk-navigatie-knop')) {
      return;
    }
    //disabled attr zetten
    const disKnop = document.querySelector('.kvk-navigatie-knop[disabled]');
    disKnop && disKnop.removeAttribute('disabled');

    knop.setAttribute('disabled', true);
    const doel = knop.getAttribute('data-doel');
    // bladen tonen en verbergen
    nodeVerzameling('.kvk-resultaat-blad').forEach((resBlad) => {
      if (resBlad.id === doel && resBlad.classList.contains('verborgen')) {
        resBlad.classList.remove('verborgen');
      } else if (!resBlad.classList.contains('verborgen')) {
        resBlad.classList.add('verborgen');
      }
    });
    // draai callback indien nodig
    if (knop.hasAttribute('data-callback')) {
      // naar camelCase
      const callbackNaam = knop
        .getAttribute('data-callback')
        .split('-')
        .map((a, i) => {
          return i === 0 ? a : a[0].toUpperCase() + a.substring(1, a.length);
        })
        .join('');
      // draai callback
      if (typeof kvkPaneelNavigatieCallbacks[callbackNaam] !== 'undefined') {
        kvkPaneelNavigatieCallbacks[callbackNaam]();
      }
    }
  });
}

/**
 * draait na tonen blad
 */
const kvkPaneelNavigatieCallbacks = {
  kvkPrintAdresVergelijking () {
    const ditFaillissement = huidigeFaillissementen.pakHuidigeFaillissementen();
    if (!ditFaillissement) {
      alert('huidig faillissement onbekend?');
    }
    if (gbi('kvk-resultaat-adres').innerHTML !== '') {
      //@TODO buggevoelig
      return;
    }

    gbi('kvk-resultaat-adres').innerHTML = laadSvg;

    const url = `https://zoeken.kvk.nl/search.ashx?handelsnaam=&postcode=${encodeURIComponent(ditFaillissement.postcode)}&huisnummer=${encodeURIComponent(
      ditFaillissement.huisnummer
    )}&plaats=&hoofdvestiging=1&rechtspersoon=1&nevenvestiging=1&zoekvervallen=0&zoekuitgeschreven=1&start=0&error=false&searchfield=uitgebreidzoeken`;
    Promise.all([vertragingsPromise(), axios.get(url)])
      .then((kvkResponse) => {
        // response komt van promise all dus is array met null, response of response, null
        const wr = kvkResponse.find((r) => r);
        verwerkKvKHTML(wr.data, 'adres', url);
      })
      .catch((err) => {
        console.error(err);
        alert('foutje schreeuw naar dev.\n' + err.message);
      });
  },
};

export function zetOpenKvKPaneelEvent () {
  gbody().addEventListener('click', function (e) {
    if (e.target.hasAttribute('data-kvk-nr')) {
      const knr = e.target.getAttribute('data-kvk-nr');
      haalKvkInfoEnPrint(knr, false);
    }
  });
}

export function setSluitKvKPaneelEvent () {
  gbi('sluit-kvk-paneel').addEventListener('click', sluitKvKPaneel);
}

export function sluitKvKPaneel () {
  // verberg resultaten tellers
  toonVerbergElementen(false, nodeVerzameling('#kvk-resultaat-teller, #kvk-resultaat-teller-print-nummers-p, #kvk-resultaat-teller-print-adres-p'));

  setTimeout(function () {
    gbi('kvk-paneel').classList.remove('open');
    // paneel legen en css classes resetten
    nodeVerzameling('.kvk-resultaat-blad').forEach((blad, i) => {
      // alle behalve eerste verbergen
      if (i === 0 && blad.classList.contains('verborgen')) {
        blad.classList.remove('verborgen');
      } else if (i > 0 && !blad.classList.contains('verborgen')) {
        blad.classList.add('verborgen');
      }
      // blad legen
      blad.innerHTML = '';
    });
    nodeVerzameling('.kvk-navigatie-knop').forEach((knop, i) => {
      if (i === 0) {
        knop.setAttribute('disabled', true);
      } else {
        knop.removeAttribute('disabled');
      }
    });
  }, 300);
}

/**
 * parsed html, schrijft naar correcte blad, zoekt mogelijk naar meer pagina's bij > 10 resultaten
 * @param {*} htmlBlob
 * @param {*} doel
 * @param {*} url
 */
function verwerkKvKHTML (htmlBlob, doel, url) {
  const doelEl = gbi(`kvk-resultaat-${doel}`);
  if (!doelEl) {
    throw new Error('doel is null');
  }
  const fragment = document.createRange().createContextualFragment(htmlBlob);

  // schrijf response lengte naar linkerkant
  const feedback = fragment.querySelector('.feedback');
  const aantalGevonden = feedback.textContent.match(/\d+/)[0];
  toonVerbergElementen(true, [gbi('kvk-resultaat-teller'), gbi(`kvk-resultaat-teller-print-${doel}-p`)]);
  gbi(`kvk-resultaat-teller-print-${doel}`).innerHTML = aantalGevonden;

  Array.from(fragment.querySelectorAll('.results > li')).forEach(bewerkInschrijvingLi);

  doelEl.innerHTML = '';
  doelEl.appendChild(fragment.querySelector('.results'));

  // vervolgpagina's er ook bij laden

  if (aantalGevonden > 10) {
    const resLijst = doelEl.querySelector('.results');
    const laderLi = document.createElement('li');
    laderLi.id = 'tijdelijke-laad-li-' + doel;
    laderLi.innerHTML = `<p>Meer dan 10 resultaten gevonden.... Aanvullende pagina's worden geladen</p>${laadSvg}`;
    resLijst.insertBefore(laderLi, resLijst.firstChild);
    for (let i = 10; i < aantalGevonden; i = i + 10) {
      const urlNieuw = url.replace('&start=0', `&start=${i}`);
      setTimeout(function () {
        axios
          .get(urlNieuw)
          .then((response) => {
            const lokaleFragment = document.createRange().createContextualFragment(response.data);
            Array.from(lokaleFragment.querySelectorAll('.results > li')).forEach(bewerkInschrijvingLi);
            Array.from(lokaleFragment.querySelectorAll('.results > li')).forEach((bewerkteInschrijvingLi) => {
              resLijst.appendChild(bewerkteInschrijvingLi);
            });
          })
          .catch((err) => console.log(err));
      }, i * 166);

      const maxTijd = Math.floor(aantalGevonden / 10) * 1666 + 500;
      console.log(maxTijd);
      setTimeout(function () {
        gbi('tijdelijke-laad-li-' + doel).parentNode.removeChild(gbi('tijdelijke-laad-li-' + doel));
      }, maxTijd);
    }
  }
}

function bewerkInschrijvingLi (inschrijvingLi) {
  inschrijvingLi.classList.add('inschrijving');
  const statusRij = inschrijvingLi.querySelector('.status');
  const s = document.createElement('span');
  s.classList.add('ingeschreven-lint');
  let tekst = '';
  if (statusRij && statusRij.textContent.includes('uitgeschreven')) {
    s.classList.add('succes');
    tekst = 'gestopt';
  } else if (!statusRij) {
    s.classList.add('geen-status');
    tekst = 'onduidelijk';
  } else {
    s.classList.add('kutbourgeois');
    tekst = 'ingeschreven';
  }

  s.innerHTML = `<span class='lint-hoek-links'></span><span class='lint-tekst'>${tekst}</span><span class='lint-hoek-rechts'></span>`;
  inschrijvingLi.appendChild(s);

  //alle links target blank en corrigeren
  Array.from(inschrijvingLi).forEach((a) => {
    a.setAttribute('href', `https://www.kvk.nl${a.getAttribute('href')}`);
    a.setAttribute('target', '_blank');
    a.setAttribute('referrer', 'https://google.com');
  });
}

const laadSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="margin: auto; display: block;" width="200px" height="200px" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid">
<g transform="translate(50 50)">
<g>
<animateTransform attributeName="transform" type="rotate" values="0;45" keyTimes="0;1" dur="0.2s" repeatCount="indefinite"></animateTransform><path d="M29.491524206117255 -5.5 L37.491524206117255 -5.5 L37.491524206117255 5.5 L29.491524206117255 5.5 A30 30 0 0 1 24.742744050198738 16.964569457146712 L24.742744050198738 16.964569457146712 L30.399598299691117 22.621423706639092 L22.621423706639096 30.399598299691114 L16.964569457146716 24.742744050198734 A30 30 0 0 1 5.5 29.491524206117255 L5.5 29.491524206117255 L5.5 37.491524206117255 L-5.499999999999997 37.491524206117255 L-5.499999999999997 29.491524206117255 A30 30 0 0 1 -16.964569457146705 24.742744050198738 L-16.964569457146705 24.742744050198738 L-22.621423706639085 30.399598299691117 L-30.399598299691117 22.621423706639092 L-24.742744050198738 16.964569457146712 A30 30 0 0 1 -29.491524206117255 5.500000000000009 L-29.491524206117255 5.500000000000009 L-37.491524206117255 5.50000000000001 L-37.491524206117255 -5.500000000000001 L-29.491524206117255 -5.500000000000002 A30 30 0 0 1 -24.742744050198738 -16.964569457146705 L-24.742744050198738 -16.964569457146705 L-30.399598299691117 -22.621423706639085 L-22.621423706639092 -30.399598299691117 L-16.964569457146712 -24.742744050198738 A30 30 0 0 1 -5.500000000000011 -29.491524206117255 L-5.500000000000011 -29.491524206117255 L-5.500000000000012 -37.491524206117255 L5.499999999999998 -37.491524206117255 L5.5 -29.491524206117255 A30 30 0 0 1 16.964569457146702 -24.74274405019874 L16.964569457146702 -24.74274405019874 L22.62142370663908 -30.39959829969112 L30.399598299691117 -22.6214237066391 L24.742744050198738 -16.964569457146716 A30 30 0 0 1 29.491524206117255 -5.500000000000013 M0 -20A20 20 0 1 0 0 20 A20 20 0 1 0 0 -20" fill="#a00d1e"></path></g></g>
</svg>`;
