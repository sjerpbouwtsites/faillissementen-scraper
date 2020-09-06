const fs = require("fs");
const axios = require("axios");
const { opslagPad, opties, nutsPad } = require("../config.js");
const nuts = require(nutsPad);
const dagenDb = nuts.pakScript("dagen-database");

async function consolideerAdressen() {
  // losse json naar één json bestand
  // schrijf naar db dat adressen geconsolideerd

  
  return new Promise((resolve) => {
    dagenDb.pakDagenData().then((dagenData) => {
      const dagenAdresTePakken = dagenData.dagenAdresTePakken
      if (!dagenAdresTePakken.length) {
        resolve({teConsolideren: []});
        return;
      }
    
      const adressenDb = pakAdressenDb();

      // teConsolideren is wat verwerkt gaat worden
      // nieuwGeconsolideerdeAdressen komt van & wordt adressen.json
      return bereidAdresBewerkVerzamelingenVoor(dagenAdresTePakken, adressenDb);      

    }).then((vanVoorbereiding) =>{
      const teConsolideren = !!vanVoorbereiding 
        ? !!vanVoorbereiding.teConsolideren 
          ? vanVoorbereiding.teConsolideren 
          : []
        : [];
      const aantalTeConsolideren = teConsolideren.length;
      if (!aantalTeConsolideren) {
        resolve("klaar");
      }

      const exitTijd = aantalTeConsolideren * 1111 + 2000;
      console.log("Adressen klaar over", exitTijd / 60000, " minuten");

      const lijstMetGeoPromises = teConsolideren.map((dagObject, index) => {
        return new Promise((resolveGeoLos, rejectGeoLos) => {
          setTimeout(() => {
            geoRequestFunc(dagObject, index, aantalTeConsolideren)
            .then(([statusCode, antwoordObject]) => {
              antwoordObject.statusCode = statusCode;
              if (['429', '404'].includes(statusCode)) {
                rejectGeoLos(antwoordObject)
              } else {
                resolveGeoLos(antwoordObject)
              }
            }).catch(err => rejectGeoLos(err)); // @TODO onduidelijke staat
          }, index * 1311);
        });

      });

      

      Promise.allSettled(lijstMetGeoPromises).then((geoPromiseRes) => {
        // gebruik nieuwGeconsolideerdeAdressen
        const succesvolleAdressen = geoPromiseRes
        .filter(gpr => gpr.status === 'fulfilled')
        .map(gpr => gpr.value)
        
        const gerateLimitteAdressen = geoPromiseRes
        .filter(gpr => gpr.status !== 'fulfilled' && gpr.value.statusCode === '429')
        .map(gpr => gpr.value)

        const ongevondenAdressen = geoPromiseRes
        .filter(gpr => gpr.status !== 'fulfilled' && gpr.value.statusCode === '404')
        .map(gpr => gpr.value)        

        const nweAdresDb = pakAdressenDb().concat(succesvolleAdressen)

        nuts.schrijfOpslag(`adressen`, nweAdresDb);
        nuts.schrijfOpslag(`ratelimit-adressen`, gerateLimitteAdressen);
        // @TODO schrijf opslag ongevonden adressen
        dagenDb.schrijfAdressenGepakt(succesvolleAdressen);
        resolve("");
      });      
    }) 
  });
}

async function zoekAdressen() {
  return new Promise((resolveZoekAdressen, rejectZoekAdressen) => {
    try {
      // @TODO alle dagen? klopt dat wel??
      dagenDb.pakDagenData().then((dagenDbStaat) => {
        const dagObjectenVerzameling = dagenDbStaat.dagenAdresTePakken;
        const zoekAdresPromises = dagObjectenVerzameling.map((dagObject, index) => {
          return new Promise((resolveZoekAdres, rejectZoekAdres) => {
            const draaiTijd = index * 800;
            setTimeout(function() {
              ///////////////////////////
              //////////////////////////
              relevantePublicatieClusters(dagObject.route)
                .then((pcClusters) => {
                  const allePublicatiesAlsString = pakPublicatiesEnSlaZePlat(pcClusters);
                  const uniekeAdressen = uniekeAdressenUitString(allePublicatiesAlsString);
                  /////////////////////
                  ///////////////!!!!!!!!!/////
                  dagObject.adresGepakt = true;
                  nuts.schrijfOpslag(`adressen/${dagObject.route}`, uniekeAdressen);
                  resolveZoekAdres(dagObject);
                })
                .catch((err) => {
                  console.error("fout in zoekAdressen interne promise");
                  rejectZoekAdres(err);
                });
            }, draaiTijd);
          });
        
        });
        
        Promise.allSettled(zoekAdresPromises)
          .then((zoekAdresPromisesRes) => {
            const succesvolleAdressen = zoekAdresPromisesRes
              .filter(zap => zap.status === 'fulfilled')
              .map(zap => zap.value)
            resolveZoekAdressen(succesvolleAdressen);
          })
          .catch((err) => {
            //@TODO
            rejectZoekAdressen(err);
          });
      }); // dagenDb promise
    } catch (error) {
      reject(error);
    }
  });
}



function uniekeAdressenUitString(pcString) {
  const w = pcString
    .join("")
    .split("vest.adr")
    .filter((s) => {
      // geen woonadressen of geheime;
      return !s.includes("woonadr") && !s.includes("eheim adres");
    })
    .map((s) => {
      const begintMetShit = s.substring(0, 2) === ". ";
      const eindigtMetShit = s.substring(s.length - 2, s.length) === ", ";
      if (begintMetShit && eindigtMetShit) {
        return s.substring(2, s.length - 2);
      } else if (begintMetShit) {
        return s.substring(2, s.length);
      } else if (eindigtMetShit) {
        return s.substring(0, s.length - 2);
      } else {
        return s;
      }
    })
    .map((s) => {
      return s.includes("corr.adr") ? s.split("corr.adr")[0] : s;
    })
    .map((s) => {
      return s.includes("KvK") ? s.split("KvK")[0] : s;
    })
    .map((s) => {
      return s.includes("Cur:") ? s.split("Cur:")[0] : s;
    });
  const regexMatches = w
    .map((s) => {
      const m = s.match(/(.+\d+\s?\w?)[,]?\s(\d{4}\s*[a-zA-Z]{2})[,]?\s([a-zA-z\-'\s]*)[,.]+/);

      if (!m && !s.toLowerCase().includes("geheim adres")) {
        if (opties.volleDebug) {
          console.log("regex klopt niet voor", s);
        }
        return null;
      }

      // laatste meuk eraf... geen komma's enzo
      let mvol = m[0].trim();
      let l = mvol[mvol.length - 1];
      let vol = (l === "." ? mvol.substring(0, mvol.length - 1) : mvol).trim().replace(/,/g, "");
      let postcode = m[2].replace(" ", "");

      const straatEnNummer = m[1];
      const straatNummerLos = straatEnNummer.match(/(\D*)(\d+.*)/).map((a) => a.trim());

      return JSON.stringify({
        adres: vol,
        straatEnNummer: m[1],
        straat: straatNummerLos[1],
        huisnummer: straatNummerLos[2],
        postcode,
        plaatsnaam: m[3],
      });
    })
    .filter(function(value, index, self) {
      return self.indexOf(value) === index;
    })
    .map((json) => {
      return JSON.parse(json);
    })
    .filter((a) => a);

  return regexMatches;
}

function geopadUitAdres(adres) {
  const a = `${opslagPad}/responses/geo/`;
  const b = `${adres.straat + adres.postcode}`.replace(/\W/g, "");
  const c = `${a}${b}`;
  //console.log(c);
  return c;
}

function pakPublicatiesEnSlaZePlat(pcClusters) {
  try {
    return pcClusters
      .map((pcc) => {
        return pcc.Publicatiesoorten.map((ps) => {
          return ps.PublicatiesNaarLocatie.map((loc) => {
            return loc.Publicaties.join("");
          }).flat();
        }).flat();
      })
      .flat();
  } catch (error) {
    console.log("STRUCTUURVERWACHTING KLOPT NIET.");
    throw new Error(error);
  }
}

function relevantePublicatieClusters(route) {
  const toegestaneClusters = opties.toegestaneClusters;
  const ontoegestaneClusters = opties.ontoegestaneClusters;

  return new Promise((resolve, reject) => {
    try {
      const responseBestand = nuts.pakOpslag(`responses/rechtbank/${route}`);
      const publicatieClusters = responseBestand.Instanties.map((instantie) => {
        return instantie.Publicatieclusters;
      })
        .flat()
        .filter((pc) => {
          const pco = pc.PublicatieclusterOmschrijving;
          if (toegestaneClusters.includes(pco)) {
            return true;
          } else if (!ontoegestaneClusters.includes(pco)) {
            console.log("pc cluster omschrijving onbekend: " + pco);
            return false;
          } else {
            return false;
          }
        });
      resolve(publicatieClusters);
    } catch (error) {
      reject(error);
    }
  });
}

function geoRequestFunc(adresObject, requestIndex, totaleAantalRequests) {
  return new Promise((resolve, reject) => {
    axios
      .get(locationIQUrl(adresObject))
      .then((r) => {
        // sla geo request op in db
        const p = geopadUitAdres(adresObject) + ".json";
        fs.writeFileSync(p, JSON.stringify(r.data[0]));

        // voortgang printen naar console.
        if ((requestIndex + 1) % 25 === 0) {
          const aantalTeDoen = totaleAantalRequests - (requestIndex + 1);
          const tijdTeDoen = Math.floor((aantalTeDoen * 1311) / 6000);
          console.log(`${requestIndex + 1} geo-gegevens opgehaald; nog ${aantalTeDoen} te doen; duurt wss ${tijdTeDoen} minuten.`);
        }
        const b = Object.assign(adresObject, {
          lat: r.data[0].lat,
          lon: r.data[0].lon,
          osm_id: r.data[0].osm_id,
        });
        resolve(["200", b]);
      })
      .catch((axiosErr) => {
        if (!axiosErr.response) {
          console.error(axiosErr);
          return;
        }

        if (axiosErr.response.status === 429) {
          resolve(["429", adresObject]);
        } else if (axiosErr.response.status === 404) {
          resolve(["404", adresObject]);
        } else {
          reject(axiosErr);
        }
      });
  });
}

/**
 * Helper. URL veilige location IQ url.
 * @param {} adresObject
 */
function locationIQUrl(adresObject) {
  const adresGeencodeerd = encodeURIComponent(`${adresObject.plaatsnaam} ${adresObject.straat}`);
  return `https://eu1.locationiq.com/v1/search.php?key=b7a32fa378c135&q=${adresGeencodeerd}&format=json`;
}

/**
 * Helper.
 * Bereid nieuw te schrijven object nieuwGeconsolideerdeAdressen voor
 * Bereid lijst met teConsolideren adressen voor.
 * @param {dagObjecten[]} dagenAdresTePakken
 * @param {adresObjecten[]} adressenDb
 */
function bereidAdresBewerkVerzamelingenVoor(dagenAdresTePakken, adressenDb) {
  return new Promise((resolve) => {
    // lijst met uitgeschreven volledige adres-adressen
    const uniekeBestaandeAdressen = new Set(adressenDb.map((a) => a.adres));

    // vinden welke adressen nog niet geconsolideerd zijn
    let teConsolideren = dagenAdresTePakken
      .map((dag) => {
        return nuts.pakOpslag(`adressen/${dag.route}`);
      })
      .flat()
      .filter((a) => {
        return !uniekeBestaandeAdressen.has(a.adres);
      });

        // HIER
    resolve({
      teConsolideren,
    });
    // @TODO
    // const geoRequestsBekend = [];

    // teConsolideren = teConsolideren.filter((adres) => {
    //   const bestandsNaam = geopadUitAdres(adres);
    //   return true;
    //   // @TODOdit optimalisatie sloopt m... parsed request niet meer
    //   // if (fs.existsSync(bestandsNaam)) {
    //   //   geoRequestsBekend.push(JSON.parse(fs.readFileSync(bestandsNaam)));
    //   //   return false;
    //   // } else {
    //   //   return true; // dus als bestand niet exist dan alsog requests doen.
    //   // }
    // });
    // nieuwGeconsolideerdeAdressen = nieuwGeconsolideerdeAdressen.concat(geoRequestsBekend);
  });
}

/**
 * helper die adressen db geeft, indien die bestaat, zo niet lege []
 */
function pakAdressenDb() {
  let adressenDb;
  if (fs.existsSync(nuts.maakOpslagPad("adressen"))) {
    console.log("PAK BESTAANDE ADRRESSE");
    adressenDb = JSON.parse(fs.readFileSync(nuts.maakOpslagPad("adressen")));
  } else {
    console.log("INSTALLATIECYCLE");
    // niets aan de hand, installatiecyclus
    adressenDb = [];
  }
  return adressenDb;
}

function lijstAlleHuidigeGeos(){
  const geoPath = nuts.maakOpslagPad('responses/geo', '');

  return fs.readdirSync(geoPath).map(fileName => {
    return path.join(fileName)
  });
}

module.exports = {
  zoekAdressen,
  consolideerAdressen
};
