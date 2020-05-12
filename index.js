// ISSUES
// pakt niet alle dagen.

// const fs = require("fs");
// const axios = require("axios").default;
const dagenDatabase = require("./dagen-database.js");
//const opties = require("./config.js");
const scraper = require("./scraper.js");
const adressen = require("./adressen.js");
const consolidatie = require("./consolidatie.js");

async function init() {
  try {
    // const db = await dagenDatabase.pakDagenData();
    // if (db.dagenTeDoen.length) {
    //   const scraperAntwoord = await scraper.scrapeDagen(db.dagenTeDoen);
    //   await dagenDatabase.zetGescraped(scraperAntwoord);
    // }
    // await adressen.zoekAdressen();
    // await adressen.consolideerAdressen();
    await consolidatie.consolideerResponsesEnAdressen();
    console.log("einde init");
  } catch (error) {
    console.error(error);
  }
}

init();

// async function init() {
//   try {
//     const { dagen, dagenTeDoen } = await pakDagenData();
//     // console.log("in init na pak Dagen Data");
//     scrapeDagen(dagenTeDoen);
//     // console.log("in init na scrape dagen");
//     const geconsolideerd = await consolideer(dagen);
//     // console.log("in init na consolidatie");
//     // console.log(geconsolideerd);
//     const metLatLng = await zoekAdressenOp(geconsolideerd);
//     // console.log(metLatLng);
//     fs.writeFileSync("geconsolideerd.json", JSON.stringify(metLatLng));

//     console.log(dagenTeDoen.length, "gedaan");

//     dagenTeDoen.forEach((dagGedaan) => {
//       dagen.find((dag) => {
//         if (dag.string === dagGedaan.string) {
//           dag.gedaan = true;
//         }
//       });
//     });
//     fs.writeFileSync("dagenDb.json", JSON.stringify(dagen));
//   } catch (err) {
//     throw new Error(err);
//   }
// }

// init();
