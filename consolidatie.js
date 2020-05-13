const fs = require("fs");
const dagenDb = require("./dagen-database.js");
const opties = require("./config.js");

async function consolideerResponsesEnAdressen() {
  return new Promise(async (resolve) => {
    const { dagenTeConsolideren } = await dagenDb.pakDagenData();
    const toegestaneClusters = opties.toegestaneClusters;
    const ontoegestaneClusters = opties.ontoegestaneClusters;
    const maanden = [
      "",
      "januari",
      "februari",
      "maart",
      "april",
      "mei",
      "juni",
      "juli",
      "augustus",
      "september",
      "oktober",
      "november",
      "december",
    ];
    const publicatieData = dagenTeConsolideren
      .map((dag) => {
        return JSON.parse(
          fs.readFileSync("opslag/responses/" + dag.route + ".json")
        );
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
        return p.Publicaties.join("\n");
      });

    const adressen = JSON.parse(fs.readFileSync("opslag/adressen.json"));

    console.log(
      "vergelijk ",
      adressen.length + " adressen met ",
      publicatieData.length,
      " publicaties"
    );

    dagenDb.schrijfTemp(publicatieData, 3);

    const verrijkteAdressen = adressen.map((kaalAdres) => {
      const pubs = publicatieData.filter((pd) => {
        return pd.includes(kaalAdres.straat);
      });
      const pubBla = pubs.join("<hr>");
      const datumRegexCap = pubBla.match(
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
      // const kvkRegexCap = pubBla.match(KvK\s?(\d{8}))

      return Object.assign(kaalAdres, {
        publicaties: pubBla,
        datum,
      });
    });

    dagenDb.schrijfGeconsolideerd(dagenTeConsolideren);

    fs.writeFileSync(
      "opslag/geconsolideerde-adressen.json",
      JSON.stringify(verrijkteAdressen, null, "  ")
    );
    resolve();
  });
}

module.exports = { consolideerResponsesEnAdressen };
