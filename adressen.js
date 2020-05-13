const fs = require("fs");
const axios = require("axios");
const dagenDb = require("./dagen-database.js");
const opties = require("./config.js");

async function consolideerAdressen() {
  // losse json naar één json bestand
  // schrijf naar db dat adressen geconsolideerd

  return new Promise(async (resolve, reject) => {
    const { dagenAdresTePakken } = await dagenDb.pakDagenData();

    if (!dagenAdresTePakken.length) {
      resolve("klaar");
      return;
    }

    const adressenDb = fs.existsSync("opslag/adressen.json")
      ? JSON.parse(fs.readFileSync("opslag/adressen.json"))
      : [];

    const alleGeconsolideerdeAdressenVol = adressenDb.map((a) => a.adres);

    // vinden welke adressen nog niet geconsolideerd zijn
    const teConsolideren = dagenAdresTePakken
      .map((dag) => {
        const b = "opslag/adressen/" + dag.route + ".json";
        if (!fs.existsSync(b)) {
          reject(b + " bestaat niet");
        }
        return JSON.parse(fs.readFileSync(b));
      })
      .flat()
      .filter((a) => {
        return !alleGeconsolideerdeAdressenVol.includes(a.adres);
      });

    if (!teConsolideren.length) {
      resolve("klaar");
      return;
    }

    console.log("consolideer: ", teConsolideren.length);

    // voor alle te consolideren request doen
    const nieuwGeconsolideerd = [].concat(adressenDb);
    const geskiptWegensRateLimit = [];
    teConsolideren.forEach((c, index) => {
      setTimeout(function () {
        axios
          .get(
            "https://eu1.locationiq.com/v1/search.php?key=b7a32fa378c135&q=" +
              encodeURIComponent(`${c.plaatsnaam} ${c.straat}`) +
              "&format=json"
          )
          .then((r) => {
            const iplus = index + 1;
            if (iplus % 25 === 0) {
              console.log(iplus, " adressen geconsolideerd");
            }
            const b = Object.assign(c, {
              lat: r.data[0].lat,
              lon: r.data[0].lon,
              osm_id: r.data[0].osm_id,
            });
            nieuwGeconsolideerd.push(b);
          })
          .catch((axiosErr) => {
            if (axiosErr.response.status === 429) {
              geskiptWegensRateLimit.push(c);
              console.log("rate limit!");
            } else if (axiosErr.response.status === 404) {
              console.log("adres 404 faal", c.adres);
            }
          });
      }, index * 1111);
    });

    // na alle requests resolven...
    const exitTijd = teConsolideren.length * 1111 + 2000;
    console.log("exit over", exitTijd);
    setTimeout(function () {
      console.log("schrijf nieuw geonsolideerd");
      fs.writeFileSync(
        "opslag/adressen.json",
        JSON.stringify(nieuwGeconsolideerd, null, "  ")
      );
      fs.writeFileSync(
        "opslag/ratelimit-adressen.json",
        JSON.stringify(geskiptWegensRateLimit, null, "  ")
      );
      dagenDb.schrijfAdressenGepakt(dagenAdresTePakken);
      resolve("hoera");
    }, exitTijd);
  });
}

async function zoekAdressen() {
  return new Promise(async (resolve, reject) => {
    const { dagenAdresTePakken } = await dagenDb.pakDagenData();

    // interval autovernietigd als alle dagen doorzocht
    // of langer dan 50s gewacht.
    let intervalTeller = 0;
    let resolveInterval = setInterval(function () {
      if (intervalTeller > 50) {
        clearInterval(resolveInterval);
        reject("DUURT LANG");
      }
      if (dagenAdresTePakken.filter((d) => !d.adresGepakt).length === 0) {
        clearInterval(resolveInterval);
        resolve(dagenAdresTePakken);
      } else {
        intervalTeller++;
      }
    }, 1000);

    try {
      dagenAdresTePakken.forEach((dagTeVerrijken, index) => {
        const draaiTijd = index * 800;
        setTimeout(async function () {
          ///////////////////////////
          //////////////////////////
          const pcClusters = await relevantePublicatieClusters(
            dagTeVerrijken.route
          );
          const allePublicatiesAlsString = pakPublicatiesEnSlaZePlat(
            pcClusters
          );
          const uniekeAdressen = uniekeAdressenUitString(
            allePublicatiesAlsString
          );
          /////////////////////
          ///////////////!!!!!!!!!/////
          dagTeVerrijken.adresGepakt = true;
          fs.writeFileSync(
            "opslag/adressen/" + dagTeVerrijken.route + ".json",
            JSON.stringify(uniekeAdressen, null, "  ")
          );
        }, draaiTijd);
      });
    } catch (error) {
      clearInterval(resolveInterval);
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
      const m = s.match(
        /(.+\d+\s?\w?)[,]?\s(\d{4}\s*[a-zA-Z]{2})[,]?\s([a-zA-z\-\'\s]*)[,.]+/
      );

      if (!m && !s.toLowerCase().includes("geheim adres")) {
        if (opties.volleDebug) {
          console.log("regex klopt niet voor", s);
        }
        return null;
      }

      // laatste meuk eraf... geen komma's enzo
      let mvol = m[0].trim();
      let l = mvol[mvol.length - 1];
      let vol = (l === "." ? mvol.substring(0, mvol.length - 1) : mvol)
        .trim()
        .replace(/\,/g, "");
      let postcode = m[2].replace(" ", "");
      return JSON.stringify({
        adres: vol,
        straat: m[1],
        postcode,
        plaatsnaam: m[3],
      });
    })
    .filter(function (value, index, self) {
      return self.indexOf(value) === index;
    })
    .map((json) => {
      return JSON.parse(json);
    })
    .filter((a) => a);

  return regexMatches;
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

  return new Promise(async (resolve, reject) => {
    try {
      const bnaam = "opslag/responses/" + route + ".json";
      if (!fs.existsSync(bnaam)) {
        reject(bnaam + " bestaat niet");
      }
      const responseBestand = JSON.parse(fs.readFileSync(bnaam));
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

module.exports = {
  zoekAdressen,
  consolideerAdressen,
};
