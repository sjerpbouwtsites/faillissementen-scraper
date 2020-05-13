// ISSUES
// pakt niet alle dagen.
// @TODO ook noteren welke requests nooit iets teruggegeven om uit scrape te halen

// const fs = require("fs");
// const axios = require("axios").default;
const dagenDatabase = require("./dagen-database.js");
//const opties = require("./config.js");
const scraper = require("./scraper.js");
const adressen = require("./adressen.js");
const consolidatie = require("./consolidatie.js");

async function init() {
  try {
    const db = await dagenDatabase.pakDagenData();
    if (db.dagenTeDoen.length) {
      const scraperAntwoord = await scraper.scrapeDagen(db.dagenTeDoen);
      await dagenDatabase.zetGescraped(scraperAntwoord);
    }
    await adressen.zoekAdressen();
    await adressen.consolideerAdressen();
    await consolidatie.consolideerResponsesEnAdressen();
    console.log("einde init");
  } catch (error) {
    console.error(error);
  }
}

init();
