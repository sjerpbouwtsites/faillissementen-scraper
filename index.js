// ISSUES
// pakt niet alle dagen.
// @TODO ook noteren welke requests nooit iets teruggegeven om uit scrape te halen

/**
 * Ik gebruik JSON bestanden als databases. Data leeft in principe binnen functies in memory
 * maar daarbuiten in JSON. De volgende functie kan evengoed weer dezelfde database aanroepen.
 */

/**
 * Als lager dan versie 14, niet draaien.
 */
try {
  const nodeversie = Number(process.versions.node.split(".")[0]);
  console.log("node versie: ", nodeversie);
  if (typeof nodeversie !== "number") {
    throw new Error({
      message: "process object anders dan verwacht",
      process: process,
    });
  }
  if (nodeversie !== 12) {
    throw new Error("de server draait op Node 12 aangezien plesk stom is. Graag ook lokaal gebruiken");
  }
} catch (error) {
  console.error(error);
  process.exit();
}

// function pakDagenVerzameling(start, end) {
//   for (var arr = [], dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
//     arr.push(new Date(dt).toISOString().split("T")[0].replace(/-/g, ""));
//   }
//   return arr;
// }

// const dagenLijst = pakDagenVerzameling(new Date("2020-01-01"), new Date("2030-12-31"));
// console.log(dagenLijst);
// process.exit();

const { nutsPad } = require("./config.js");
const { pakScript } = require(nutsPad);
var clc = require("cli-color");
const log = pakScript("logger");

async function init() {
  try {
    const installatie = pakScript("installatie");
    const dagenDatabase = pakScript("dagen-database");
    const scraper = pakScript("scraper");
    const adressen = pakScript("adressen");
    const consolidatie = pakScript("consolidatie");
    const printMarx = pakScript("printMarx");
    //controleert bestaan van mappen
    await installatie.controleerInstallatie();
    const db = await dagenDatabase.pakDagenData();
    if (db.dagenTeDoen.length) {
      const scraperAntwoord = await scraper.scrapeDagen(db.dagenTeDoen);
      await dagenDatabase.zetGescraped(scraperAntwoord);
    }
    await adressen.zoekAdressen();

    await adressen.consolideerAdressen();
    const consolidatieAntwoord = await consolidatie.consolideerResponsesEnAdressen();
    // zoek per adres alle vestigingen op, schrijft die weg met datum
    // indien vestigingen bekend maar verouderd > 7 dagen
    // async op achtergrond vernieuwen
    const vestigingenOpgezocht = await consolidatie.zoekInKvKAndereVestingenPerAdres();
    console.log(clc.bgWhite.black(`\n\t\tKLAAR!\t\n\t${consolidatieAntwoord} adressen beschikbaar\t\n\t${vestigingenOpgezocht.length} vestigingen opgezocht`));
    printMarx.print();
  } catch (error) {
    console.error(error);
  }
}

init();
