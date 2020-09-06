const { opties, nutsPad } = require("../config.js");
const {
  schrijfOpslag,
  schrijfTemp,
  legeCatch,
  maakOpslagPad,
} = require(nutsPad);
const axios = require("axios").default;
const fs = require("fs");

/**
 * Plant requests naar de rechtspraak server in.
 * Slaat evt. dit op in opslag/responses/rechtbank @TODO kvk / rechtspraak door elkaar gehaald.
 * Als laatste in planning de resolve()
 *
 */
async function scrapeDagen(dagenTeDoen) {
  const reedsGescraped = dagenTeDoen.filter((d) => d.gescraped);
  const teScrapen = dagenTeDoen.filter((d) => !d.gescraped);
  // vermoedelijk buggy
  // const teScrapen = opties.overschrijfAlleRequest
  //   ? nietGescrapedVolgensDb
  //   : nietGescrapedVolgensDb.filter((dbDag) => {
  //       return !fs.existsSync(
  //         maakOpslagPad(`responses/rechtbank/${dbDag.route}`)
  //       );
  //     });

  const exitTijd = teScrapen.length * 800 + 800;
  const minutenExitTijd = exitTijd / 60000;
  if (minutenExitTijd > 2) {
    console.log(`scraper klaar over ${exitTijd / 60000} minuten`);
  } else {
    console.log(`scraper klaar over ${exitTijd / 1000} seconden`);
  }

  return new Promise((resolve) => {
    const gescraped = [];
    const hadMelding = [];
    teScrapen.forEach((dag, index) => {
      // wanneer de timeout vuurt
      const planningVanafNu = index * 800;

      setTimeout(function() {
        axios
          .get(
            `https://insolventies.rechtspraak.nl/Services/BekendmakingenService/haalOp/${dag.route}`
          )
          .then(function(response) {
            const iplus = index + 1;
            if (iplus % 10 === 0) {
              const teDoen = teScrapen.length - iplus;
              const teDoenTijd = Math.floor((teDoen * 800) / 6000);
              console.log(
                `${iplus} dagen gescraped, ${teScrapen.length -
                  iplus} te gaan. Duurt wss ${teDoenTijd} minuten.`
              );
            }

            if (response.data.Instanties && response.data.Instanties.length) {
              hadMelding.push(dag);
              schrijfOpslag(`responses/rechtbank/${dag.route}`, response.data);
            }

            gescraped.push(dag);
          })
          .catch(legeCatch);
      }, planningVanafNu);
    });
    setTimeout(function() {
      resolve({
        gescraped,
        reedsGescraped,
        hadMelding,
      });
    }, exitTijd);
  });
}

module.exports = {
  scrapeDagen,
};
