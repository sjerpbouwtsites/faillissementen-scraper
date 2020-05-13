const { opslagPad, opties } = require("../config.js");
const axios = require("axios").default;
const fs = require("fs");

/**
 * Plant requests naar de rechtspraak server in.
 * Slaat evt. dit op in opslag/responses/kvk @TODO kvk / rechtspraak door elkaar gehaald.
 * Als laatste in planning de resolve()
 *
 */
async function scrapeDagen(dagenTeDoen) {
  const reedsGescraped = dagenTeDoen.filter((d) => d.gescraped);
  const nietGescrapedVolgensDb = dagenTeDoen.filter((d) => !d.gescraped);
  const teScrapen = opties.overschrijfAlleRequest
    ? nietGescrapedVolgensDb
    : nietGescrapedVolgensDb.filter((dbDag) => {
        return !fs.existsSync(opslagPad(`responses/kvk/${dbDag.route}`));
      });

  const exitTijd = teScrapen.length * 800 + 800;
  console.log(`scraper klaar over ${exitTijd / 60000} minuten`);

  return new Promise((resolve) => {
    const gescraped = [];
    const hadMeldingen = [];
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
                fs.writeFileSync(
                  opslagPad(`responses/kvk/${dag.route}`),
                  JSON.stringify(response.data)
                );
                hadMeldingen.push(dag);
              }
              gescraped.push(dag);
            }
          })
          .catch(function (error) {
            // handle error
            console.log(error);
          });
      }, planningVanafNu);
    });
    setTimeout(function () {
      resolve({
        gescraped,
        reedsGescraped,
        hadMeldingen,
      });
    }, exitTijd);
  });
}

module.exports = {
  scrapeDagen,
};
