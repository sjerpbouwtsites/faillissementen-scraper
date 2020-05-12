const opties = require("./config.js");
const axios = require("axios").default;
const fs = require("fs");

// function sorteerInTeScrapenEnGedaan(dagenTeDoen) {
//   return new Promise((resolve) => {
//     let reedsGescraped = [];
//     let teScrapen = [];
//     if (!opties.overschrijfAlleRequest) {
//       dagenTeDoen.forEach((dag, index) => {
//         if (fs.existsSync("responses/" + dag.route + ".json")) {
//           reedsGescraped.push(dag);
//         } else {
//           teScrapen.push(dag);
//         }
//       });
//     }
//     resolve({
//       reedsGescraped,
//       teScrapen,
//     });
//   });
// }

async function scrapeDagen(dagenTeDoen) {
  // const { reedsGescraped, teScrapen } = await sorteerInTeScrapenEnGedaan(
  //   dagenTeDoen
  // );

  const reedsGescraped = dagenTeDoen.filter((d) => d.gescraped);
  const teScrapen = dagenTeDoen.filter((d) => !d.gescraped);
  const exitTijd = teScrapen.length * 800 + 800;
  const scrapeRoutes = teScrapen.map((t) => t.route).join("; ");
  console.log("EXIT OVER ", exitTijd, "; scrape", scrapeRoutes);

  return new Promise((resolve) => {
    const gescraped = [];
    const hadMeldingen = [];
    teScrapen.forEach((dag, index) => {
      const planningVanafNu = index * 800;
      const url = `https://insolventies.rechtspraak.nl/Services/BekendmakingenService/haalOp/${dag.route}`;

      setTimeout(function () {
        axios
          .get(url)
          .then(function (response) {
            const iplus = index + 1;
            if (iplus % 10 === 0) {
              console.log(iplus, " dagen gescraped");
            }
            if (opties.schrijfAlleRequestsWeg) {
              if (response.data.Instanties && response.data.Instanties.length) {
                fs.writeFileSync(
                  "responses/" + dag.route + ".json",
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
