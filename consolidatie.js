const fs = require("fs");
const dagenDb = require("./dagen-database.js");
const opties = require("./config.js");

async function consolideerResponsesEnAdressen() {
  return new Promise(async (resolve) => {
    const { dagenTeConsolideren } = await dagenDb.pakDagenData();
    const toegestaneClusters = opties.toegestaneClusters;
    const ontoegestaneClusters = opties.ontoegestaneClusters;

    const publicatieData = dagenTeConsolideren
      .map((dag) => {
        return JSON.parse(fs.readFileSync("responses/" + dag.route + ".json"));
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

    const adressen = JSON.parse(fs.readFileSync("adressen.json"));

    console.log(
      "vergelijk ",
      adressen.length + " adressen met ",
      publicatieData.length,
      " bestanden"
    );

    dagenDb.schrijfTemp(publicatieData, 3);

    const verrijkteAdressen = adressen.map((kaalAdres) => {
      const pubs = publicatieData.filter((pd) => {
        return pd.includes(kaalAdres.straat);
      });
      return Object.assign(kaalAdres, {
        publicaties: pubs.join("<br>"),
      });
    });

    fs.writeFileSync(
      "geconsolideerde-adressen.json",
      JSON.stringify(verrijkteAdressen, null, "  ")
    );
  });
}

module.exports = { consolideerResponsesEnAdressen };
