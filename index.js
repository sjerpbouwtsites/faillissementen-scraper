// ISSUES
// pakt niet alle dagen.
// @TODO ook noteren welke requests nooit iets teruggegeven om uit scrape te halen

/**
 * Ik gebruik JSON bestanden als databases. Data leeft in principe binnen functies in memory
 * maar daarbuiten in JSON. De volgende functie kan evengoed weer dezelfde database aanroepen.
 */

const { nutsPad } = require("./config.js");
const { pakScript } = require(nutsPad);

async function init() {
  try {
    const installatie = pakScript("installatie");
    const dagenDatabase = pakScript("dagen-database");
    const scraper = pakScript("scraper");
    const adressen = pakScript("adressen");
    const consolidatie = pakScript("consolidatie");
    // controleert bestaan van mappen
    await installatie.controleerInstallatie();
    const db = await dagenDatabase.pakDagenData();
    if (db.dagenTeDoen.length) {
      const scraperAntwoord = await scraper.scrapeDagen(db.dagenTeDoen);
      await dagenDatabase.zetGescraped(scraperAntwoord);
    }
    await adressen.zoekAdressen();
    await adressen.consolideerAdressen();
    const consolidatieAntwoord = await consolidatie.consolideerResponsesEnAdressen();
    console.log("einde init", consolidatieAntwoord, " adressen beschikbaar");
  } catch (error) {
    console.error(error);
  }
}

init();
