const { opslagPad, opties, nutsPad } = require("../config.js");
const { schrijfOpslag, pakOpslag } = require(nutsPad);
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
  const nietGescrapedVolgensDb = dagenTeDoen.filter((d) => !d.gescraped);
  const teScrapen = opties.overschrijfAlleRequest
    ? nietGescrapedVolgensDb
    : nietGescrapedVolgensDb.filter((dbDag) => {
        return !fs.existsSync(opslagPad(`responses/rechtbank/${dbDag.route}`));
      });

  const exitTijd = teScrapen.length * 800 + 800;
  console.log(`scraper klaar over ${exitTijd / 60000} minuten`);

  return new Promise((resolve) => {
    const gescraped = [];
    teScrapen.forEach((dag, index) => {
      // wanneer de timeout vuurt
      const planningVanafNu = index * 800;

      setTimeout(function () {
        axios
          .get(
            `https://insolventies.rechtspraak.nl/Services/BekendmakingenService/haalOp/${dag.route}`
          )
          .then(function (response) {
            const iplus = index + 1;
            if (iplus % 10 === 0) {
              console.log(
                `${iplus} dagen gescraped, ${teScrapen.length - iplus} te gaan`
              );
            }
            if (opties.schrijfAlleRequestsWeg) {
              if (response.data.Instanties && response.data.Instanties.length) {
                schrijfOpslag(
                  `responses/rechtbank/${dag.route}`,
                  response.data
                );
              }
              gescraped.push(dag);
            }
          })
          .catch(nuts.legeCatch);
      }, planningVanafNu);
    });
    setTimeout(function () {
      resolve({
        gescraped,
        reedsGescraped,
      });
    }, exitTijd);
  });
}

module.exports = {
  scrapeDagen,
};
