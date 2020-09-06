const { opties, nutsPad, maanden } = require('../config.js');
const fs = require('fs');
const { pakScript, pakOpslag, schrijfOpslag, maakOpslagPad, DateNaarDatumGetal, schrijfTemp } = require(nutsPad);
const dagenDb = pakScript('dagen-database');
const axios = require('axios');
const { parse } = require('node-html-parser');
const nuts = require(nutsPad);

async function consolideerResponsesEnAdressen () {
  return new Promise(async (resolve) => {
    const { dagenTeConsolideren } = await dagenDb.pakDagenData();

    // het is het continu reduceren van de objecten totdat alleen de publicaties over zijn.
    const publicatieData = maakPublicatieData(dagenTeConsolideren);

    const adressen = pakOpslag('adressen')
    const geconsolideerdeAdressen = pakOpslag('geconsolideerde-adressen');

    const verrijkteAdressen = adressen.map((kaalAdres) => {

      // geef eerderGeconsolideerd terug indien niet telkens
      // opnieuw consolideren & reeds geconsolideerd
      if (!opties.consolideerTelkensOpnieuw) {
        const eerderGeconsolideerd = geconsolideerdeAdressen.find(cAdres => cAdres.osm_id === kaalAdres.osm_id);
        if (eerderGeconsolideerd) {
          return Object.assign(kaalAdres, eerderGeconsolideerd);
        }
      }

      //@TODO SLECHTE CHECK
      const samengevoegdePublicaties = maakSamenGevoegdePublicaties(publicatieData, kaalAdres.straat)
      const datumRegexCap = samengevoegdePublicaties.match(/(\d{2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)+\s+(\d{4})/);
      let datum = '';
      if (!!datumRegexCap) {
        const maand = maanden
          .indexOf(datumRegexCap[2])
          .toString()
          .padStart(2, '0');

        const dag = datumRegexCap[1].toString().padStart(2, '0');
        datum = `${datumRegexCap[3]}-${maand}-${dag}`;
      }
      let kvkRegexCap = samengevoegdePublicaties.match(/KvK.*(\d{8})/g);
      let kvkNummers = kvkRegexCap && kvkRegexCap.length ? kvkRegexCap.map((k) => k.match(/\d+/)[0]) : [];

      const regexCap = samengevoegdePublicaties.match(/[FSR].\d{1,4}\/.\d{1,4}\/.\d{1,4}\)[,]?([^,]*)[,]/);
      const hodnCap = samengevoegdePublicaties.match(/hodn(.*)corr/);

      let bedrijfsNaam = !!regexCap ? regexCap[1].split('corr.adr')[0].trim() : 'onbekend';

      if (bedrijfsNaam === 'onbekend' && !!hodnCap) {
        bedrijfsNaam = hodnCap[1].trim().split('.V.')[0] + '.V.';
      }

      return Object.assign(kaalAdres, {
        vestigingen: kaalAdres.vestigingen | false,
        vestigingenDatum: kaalAdres.vestigingenDatum | null,
        publicaties: samengevoegdePublicaties,
        kvk: kvkNummers,
        bedrijfsNaam,
        datum,
      });
    }); // verrijkte adressen

    dagenDb.schrijfGeconsolideerd(dagenTeConsolideren);

    schrijfOpslag(`geconsolideerde-adressen`, verrijkteAdressen);

    resolve(verrijkteAdressen.length);
  });
}

/**
 * haalt uit KvK alle adressen op per vestiging.
 */
async function zoekInKvKAndereVestingenPerAdres () {
  return new Promise((resolveAlleVestigingen, rejectAlleVestigingen) => {
    /**
     * geconsolideerde adressen
     */
    const adressen = pakOpslag('geconsolideerde-adressen');
    let { vestigingenNieuwTeHalen, vestigingenVerouderd } = pakNieuwTeHalenEnVerouderdeKvKLocaties(adressen);
    console.log(`Haal ${vestigingenNieuwTeHalen.length} kvk locaties op..... duurt ${Math.ceil((vestigingenNieuwTeHalen.length * 1643) / 60000)} minuten`);
  
    const kvkPromises = vestigingenNieuwTeHalen.map((adresObject, adresObjectIndex) => {
      return new Promise((timeoutResolve, timeoutReject) => {
        setTimeout(() => {
          if (adresObjectIndex > 9 && adresObjectIndex % 10 === 0) {
            console.log(`${adresObjectIndex} kvk locaties opgehaald`);
          }
          kvkPromiseTimeoutFunc(adresObject, timeoutResolve, timeoutReject);
        }, adresObjectIndex * 1643);
      });
    });

    // setTimeout(function(){
    //   console.log(kvkPromises)
    // }, 30000);

    Promise.allSettled(kvkPromises)
      .then((respList) => {
        console.log('klaar met alle kvk requests')
        const mislukt = respList.filter((r) => r.status !== 'fulfilled');
        // @TODO milsukten
        const kvkSuccessen = respList.filter((r) => r.status === 'fulfilled');
        kvkSuccessen.forEach((succes) => {
          const verwerktSucces = verwerkKvKHTML(succes.value.html, succes.value.osm_id);
          for (let osm_id in verwerktSucces) {
            schrijfOpslag(`responses/kvk/${osm_id}`, verwerktSucces[osm_id].vestigingData);
            // nu nieuw geconsolideerd adressen object maken
            const relevantAdres = adressen.find((adres) => adres.osm_id === osm_id);
            if (!relevantAdres) {
              console.warn(' O NNO', osm_id);
              return;
            }

            relevantAdres.vestigingen = true;
            relevantAdres.vestigingenDatum = new Date().toISOString();
          }
        });

        schrijfOpslag('geconsolideerde-adressen', adressen);

        resolveAlleVestigingen(vestigingenNieuwTeHalen);
      })
      .catch((err) => {
        console.log(err);
        rejectAlleVestigingen(err);
      });

    // async bijwerkers
  });
}

module.exports = { consolideerResponsesEnAdressen, zoekInKvKAndereVestingenPerAdres };

/**
 * 
 * @param {*} publicatieData 
 */
function maakSamenGevoegdePublicaties(publicatieData, straat){
  const pubs = publicatieData
  .map((publicatieReeks) => {
    return publicatieReeks.filter((publicatie) => {
      return publicatie.includes(straat);
    });
  })
  .filter((pubs) => pubs.length);

return pubs.join('<hr>');  
}
function verwerkKvKHTML (htmlVerzameling, osm_id) {
  
  if (htmlVerzameling.includes(undefined)) {
    console.log(' deel HTML undefined?', htmlVerzameling)
  }
  const htmlVerwerktPerRequest = htmlVerzameling.map((html) => {
    if (!html) {
      console.log(' FOUT ', ' CONSOLE HTML VERWERKT PER REQUEST');
    }
    const aantalRes = Number(html.match(/ong>(\d+)</)[1]);
    const bewHTML = html.split('<li class="">').join('<li class="result-li">');
    parsedHTML = parse(bewHTML);
    const vestigingData = parsedHTML.querySelectorAll('.result-li').map((resLi) => {
      const vestigingHTML = parse(resLi.innerHTML);

      // kvk, vestigingsnr, straat en nr, postcode, stad
      const kvkMetaEl = vestigingHTML.querySelector('.kvk-meta');
      let kvkMeta;
      if (kvkMetaEl !== 'undefined' && !!kvkMetaEl) {
        kvkMeta= kvkMetaEl 
        .innerHTML.split('</li>')
        .map((blob) => blob.replace('<li>', '').trim())
        .splice(0, 5);
      } else {
        kvkMeta= '';
      }

      const statusEl = vestigingHTML.querySelector('.status');

      return {
        kvkMeta,
        kvkLink: `https://www.kvk.nl${vestigingHTML.querySelector('.handelsnaamHeader a').getAttribute('href')}`,
        isHoofdVestiging: resLi.innerHTML.includes('hoofdvestigingTag'),
        handelsNaam: vestigingHTML.querySelector('.handelsnaamHeader').rawText,
        uitgeschreven: statusEl !== 'undefined' ? statusEl.rawText.includes('uitgeschreven') : false,
        werkzaamheden: vestigingHTML.querySelector('.snippet-result')?.rawText,
      };
    });

    return {
      aantalRes,
      osm_id,
      vestigingData,
    };
  });

  // nu nog per osm_id sorteren
  const verwerktGesorteerd = {};
  htmlVerwerktPerRequest.forEach((v) => {
    if (!verwerktGesorteerd[v.osm_id]) {
      verwerktGesorteerd[v.osm_id] = v;
    } else {
      verwerktGesorteerd[v.osm_id].vestigingData = verwerktGesorteerd[v.osm_id].vestigingData.concat(v.vestigingData);
    }
  });
  return verwerktGesorteerd;
}

/**
 * Helper voor zoekInKvKAndereVestingenPerAdres. Axios naar KvK voor adres.
 * Indien nodig worden ook vervolg paginas meegepakt, kvk geeft max 10 res per pagina
 * krijgt HTML blobs terug van KVK
 * @param {} adresobject
 * @param {*} resolve
 * @param {*} reject
 */
function kvkPromiseTimeoutFunc ({ postcode, huisnummer, osm_id }, resolve, reject) {
  const url = `https://zoeken.kvk.nl/search.ashx?handelsnaam=&postcode=${encodeURIComponent(postcode)}&huisnummer=${encodeURIComponent(huisnummer)}&plaats=&hoofdvestiging=1&rechtspersoon=1&nevenvestiging=1&zoekvervallen=0&zoekuitgeschreven=1&start=0&error=false&searchfield=uitgebreidzoeken`;
  axios
    .get(url)
    .then((kvkResponse) => {
      const aantalRes = Number(kvkResponse.data.match(/ong>(\d+)</)[1]);
      // tientallen
      const meerRequestStartPunt = [];
      for (let i = 10; i < aantalRes && i <= opties.maxAantalVestingen; i += 10) {
        meerRequestStartPunt.push(i);
      }

      // if (meerRequestStartPunt.length) {
      //   console.log(' meer requests: '+ meerRequestStartPunt.join('; '), " CONSOLE meer requests length")
      // }

      const reqPromises = meerRequestStartPunt.map((startpunt, startpuntIndex) => {
        return new Promise((meerResolve, meerReject) => {
          setTimeout(()=>{
            const url = `https://zoeken.kvk.nl/search.ashx?handelsnaam=&postcode=${encodeURIComponent(postcode)}&huisnummer=${encodeURIComponent(huisnummer)}&plaats=&hoofdvestiging=1&rechtspersoon=1&nevenvestiging=1&zoekvervallen=0&zoekuitgeschreven=1&start=${startpunt}&error=false&searchfield=uitgebreidzoeken`;
            axios
              .get(url)
              .then((kvkExtraResponse) => {
                meerResolve(kvkExtraResponse.data);
              })
              .catch((err) => {
                console.log(err, " CONSOLE reqPromises error");
                meerReject(err);
              });
          }, startpuntIndex * 1643)
        });
      });
      // originele resp ook in promise tbv promise all settles
      reqPromises.push(
        new Promise((legePromiseResolve) => {
          legePromiseResolve(kvkResponse.data);
        })
      );

      Promise.allSettled(reqPromises).then((allePaginasRes) => {
  
        resolve({
          html: allePaginasRes.map((apr) => apr.value),
          osm_id,
        });
      });
    })
    .catch((err) => reject(err));
}

function maakPublicatieData (dagenTeConsolideren) {
  const toegestaneClusters = opties.toegestaneClusters;
  const ontoegestaneClusters = opties.ontoegestaneClusters;
  schrijfTemp(dagenTeConsolideren)
  return dagenTeConsolideren
    .map((dag) => {
      const p = maakOpslagPad(`responses/rechtbank/${dag.route}`);
      if (!fs.existsSync(p)) {
        return [];
      }
      const bs = JSON.parse(fs.readFileSync(p));
      return bs;
    })
    .flat()
    .map((bestand) => {
      return bestand.Instanties;
    })
    .flat()
    .map((instantie) => {
      return instantie.Publicatieclusters;
    })
    .flat()
    .filter((pc) => {
      const pco = pc.PublicatieclusterOmschrijving;
      if (toegestaneClusters.includes(pco)) {
        return true;
      } else if (!ontoegestaneClusters.includes(pco)) {
        console.log('pc cluster omschrijving onbekend: ' + pco);
        return false;
      } else {
        return false;
      }
    })
    .map((pc) => {
      return pc.Publicatiesoorten;
    })
    .flat()
    .map((pc) => {
      return pc.PublicatiesNaarLocatie;
    })
    .flat()
    .map((p) => {
      return p.Publicaties.map((p) => p.replace('corr.adr', ',corr.adr'));
    });
}

/**
 * Helper van zoekInKvKAndereVestingenPerAdres. Maak verzameligen met
 * nieuw te halen kvk locaties / vestigingen en verouderde locaties.
 * verouderde locaties zijn ouder dan een week.
 * 
 * @param {} adressen 
 */
function pakNieuwTeHalenEnVerouderdeKvKLocaties (adressen) {
  let vestigingenNieuwTeHalen = adressen.filter((adres) => {
    return !adres.vestigingen;
  });

  if (vestigingenNieuwTeHalen.length > opties.maxKvKRequests) {
    console.log(`Te veel vestigingen om op te halen van KVK: ${vestigingenNieuwTeHalen.length}. Doe nu batch van ${opties.maxKvKRequests}.`);
    vestigingenNieuwTeHalen = vestigingenNieuwTeHalen.splice(0, opties.maxKvKRequests);
  }

  // @TODO
  let w = new Date();
  w = w.setDate(w.getDate() - 7);
  const eenWeekGeledenStr = DateNaarDatumGetal(new Date(w).toISOString());
  const vestigingenVerouderd = adressen.filter((adres) => {
    return !!adres.vestigingenDatum && adres.vestigingen && adres.vestigingenDatum < eenWeekGeledenStr;
  });
  return {
    vestigingenNieuwTeHalen,
    vestigingenVerouderd,
  };
}

