// ISSUES
// pakt niet alle dagen.
// @TODO ook noteren welke requests nooit iets teruggegeven om uit scrape te halen

const { scriptPad, opties } = require("./config.js");

const dagenDatabase = require(scriptPad("dagen-database"));

const scraper = require(scriptPad("scraper"));

const adressen = require(scriptPad("adressen"));

const consolidatie = require(scriptPad("consolidatie"));

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
