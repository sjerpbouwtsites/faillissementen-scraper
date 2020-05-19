const { opties, nutsPad, maanden } = require("../config.js");
const fs = require("fs");
const {
  pakScript,
  pakOpslag,
  schrijfOpslag,
  maakOpslagPad,
  schrijfTemp,
} = require(nutsPad);
const dagenDb = pakScript("dagen-database");

async function consolideerResponsesEnAdressen() {
  return new Promise(async (resolve) => {
    const { dagenTeConsolideren } = await dagenDb.pakDagenData();

    // het is het continu reduceren van de objecten totdat alleen de publicaties over zijn.
    const publicatieData = maakPublicatieData(dagenTeConsolideren);

    const adressen = await pakOpslag("adressen");

    const verrijkteAdressen = adressen.map((kaalAdres) => {
      const pubs = publicatieData
        .map((publicatieReeks) => {
          return publicatieReeks.filter((publicatie) => {
            return publicatie.includes(kaalAdres.straat);
          });
        })
        .filter((pubs) => pubs.length);

      const samengevoegdePublicaties = pubs.join("<hr>");
      const datumRegexCap = samengevoegdePublicaties.match(
        /(\d{2})\s+(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)+\s+(\d{4})/
      );
      let datum = "";
      if (!!datumRegexCap) {
        const maand = maanden
          .indexOf(datumRegexCap[2])
          .toString()
          .padStart(2, "0");

        const dag = datumRegexCap[1].toString().padStart(2, "0");
        datum = `${datumRegexCap[3]}-${maand}-${dag}`;
      }
      let kvkRegexCap = samengevoegdePublicaties.match(/KvK.*(\d{8})/g);
      let kvkNummers =
        kvkRegexCap && kvkRegexCap.length
          ? kvkRegexCap.map((k) => k.match(/\d+/)[0])
          : [];

      const regexCap = samengevoegdePublicaties.match(
        /[FSR].\d{1,4}\/.\d{1,4}\/.\d{1,4}\)[,]?([^,]*)[,]/
      );
      const hodnCap = samengevoegdePublicaties.match(/hodn(.*)corr/);

      let bedrijfsNaam = !!regexCap
        ? regexCap[1].split("corr.adr")[0].trim()
        : "onbekend";

      if (bedrijfsNaam === "onbekend" && !!hodnCap) {
        bedrijfsNaam = hodnCap[1].trim().split(".V.")[0] + ".V.";
      }

      return Object.assign(kaalAdres, {
        publicaties: samengevoegdePublicaties,
        kvk: kvkNummers,
        bedrijfsNaam,
        datum,
      });
    });

    dagenDb.schrijfGeconsolideerd(dagenTeConsolideren);

    schrijfOpslag(`geconsolideerde-adressen`, verrijkteAdressen);

    resolve(verrijkteAdressen.length);
  });
}

module.exports = { consolideerResponsesEnAdressen };

function maakPublicatieData(dagenTeConsolideren) {
  const toegestaneClusters = opties.toegestaneClusters;
  const ontoegestaneClusters = opties.ontoegestaneClusters;

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
        console.log("pc cluster omschrijving onbekend: " + pco);
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
      return p.Publicaties.map((p) => p.replace("corr.adr", ",corr.adr"));
    });
}
