const fs = require("fs");
const config = require("../config.js");
const { schrijfOpslag, maakOpslagPad, DateNaarDatumGetal } = require(config.nutsPad);

/**
 * CRUD voor de dagenDb.json.
 * initialisatie indien bestand niet bestaat op basis van datums in config.
 * Er wordt véél geschreven naar de json in plaats van data in memory te houden,
 * mede vanwege rommelige / asyncrone aard van app.
 * Zo weet je dat als je dagenDatabase.pakDagenDate() opvraagt het waarschijnlijk
 * de meest actuele data van een andere functie is.
 */

function maakDagenDb() {
  return new Promise((resolve) => {
    var dagenLijst = pakDagenVerzameling(new Date(config.opties.startDatum), new Date(config.opties.eindDatum));
    console.log(dagenLijst);
    const dagenVoorDb = dagenLijst.map((d) => {
      const route = ISONaarRechtspraak(d);
      const pad = maakOpslagPad("responses/rechtbank/" + route);
      const meldingBestandBestaat = fs.existsSync(pad);
      return {
        datum: d,
        route, // API endpoint rechtbank
        gescraped: meldingBestandBestaat, // valt terug op false; van rechtbank;
        geconsolideerd: false, // adres en publicaties samengevoegd
        adresGepakt: false, // van locationIQ server latlng geplukt;
        hadMelding: meldingBestandBestaat, // indien melding niet bestaat, valt terug op false, init.
      };
    });
    schrijfOpslag("dagenDb", dagenVoorDb);
    resolve(dagenVoorDb);
  });
}

function pakDagenData() {
  return new Promise(async (resolve, reject) => {
    // db wordt uit JSON gehaald of hier gemaakt
    let dagenDb;
    let makenGebruikVanNieuweDb = !fs.existsSync(maakOpslagPad("dagenDb"));
    if (makenGebruikVanNieuweDb) {
      //console.log("maak nieuwe db");
      dagenDb = await maakDagenDb();
    } else {
      const gelezenDb = fs.readFileSync(config.opslagPad + "/dagenDb.json");
      dagenDb = JSON.parse(gelezenDb);

      // console.log("pak bestaande db");
      // try {
      //   dagenDb = await pakOpslag("dagenDb");
      // } catch (error) {
      //   console.log("db status:");
      //   console.log(typeof dagenDb);
      //   console.log(dagenDb.length);
      //   reject(error);
      // }
    }

    const vandaag = DateNaarDatumGetal(new Date());

    // 'te doen' zijn nog niet gescraped van de rechtbank en zijn vandaag of eerder.
    let dagenTeDoen = dagenDb.filter((dbDag) => {
      const vglMetVandaag = DateNaarDatumGetal(dbDag.datum);
      return !dbDag.gescraped && vglMetVandaag <= vandaag;
    });

    // Adres wordt vanaf locationIQ server gehaald na scrapen rechtbank
    let dagenAdresTePakken = dagenDb.filter((dbDag) => {
      const vglMetVandaag = DateNaarDatumGetal(dbDag.datum);
      return dbDag.gescraped && dbDag.hadMelding && !dbDag.adresGepakt && vglMetVandaag <= vandaag;
    });

    // samenvoegen van adressen en rechtbank responses
    // consolideerTelkensOpnieuw is eigenlijk een debugOptie
    let dagenTeConsolideren = dagenDb.filter((dbDag) => {
      const vglMetVandaag = DateNaarDatumGetal(dbDag.datum);
      const consolidatieBool = !dbDag.geconsolideerd || config.opties.consolideerTelkensOpnieuw;
      return dbDag.gescraped && dbDag.hadMelding && vglMetVandaag <= vandaag && consolidatieBool;
    });

    if (config.opties.debugDb) {
      console.log("db status\n tot:", dagenDb.length, "te doen:", dagenTeDoen.length, "adres te pakken: ", dagenAdresTePakken.length, "te consolideren: ", dagenTeConsolideren.length);
    } else {
      console.log();
    }

    resolve({
      dagen: dagenDb,
      dagenTeDoen,
      dagenTeConsolideren,
      dagenAdresTePakken,
    });
  });
}

// apart gehouden want is snel verwarrend
async function zetGescraped({ gescraped, hadMelding }) {
  return new Promise(async (resolve) => {
    const dagenData = await pakDagenData();

    const nweDagenData = dagenData.dagen.map((dbDag) => {
      const isGescraped = gescraped.some((g) => g.route === dbDag.route);
      const dezeHadMelding = hadMelding.some((g) => g.route === dbDag.route);

      return Object.assign(dbDag, {
        gescraped: dbDag.gescraped || isGescraped,
        hadMelding: dbDag.hadMelding || dezeHadMelding,
      });
    });

    schrijfOpslag("dagenDb", nweDagenData);
    resolve();
  });
}

// waarom is de ene met een promise en de andere niet
async function schrijfAdressenGepakt(dagenAdresGepakt) {
  const dagenData = await pakDagenData();

  const nweDagenData = dagenData.dagen.map((dbDag) => {
    const adresGepakt = dagenAdresGepakt.some((h) => h.route === dbDag.route);
    return Object.assign(dbDag, {
      adresGepakt: dbDag.adresGepakt || adresGepakt,
    });
  });

  schrijfOpslag("dagenDb", nweDagenData);
}

async function schrijfGeconsolideerd(geconsolideerdDagen) {
  const dagenData = await pakDagenData();

  const nweDagenData = dagenData.dagen.map((dbDag) => {
    const isNieuwGeconsolideerd = geconsolideerdDagen.some((h) => h.route === dbDag.route);
    return Object.assign(dbDag, {
      geconsolideerd: dbDag.geconsolideerd || isNieuwGeconsolideerd,
      adresGepakt: dbDag.geconsolideerd || isNieuwGeconsolideerd, // HACK om achter te fiksen dat adresGepakt niet meer meegenomen wordt...
    });
  });

  schrijfOpslag("dagenDb", nweDagenData);
}

///// ///// ///// ///// ///// /////

module.exports = {
  pakDagenData,
  zetGescraped,
  schrijfAdressenGepakt,
  schrijfGeconsolideerd,
};

///// ///// ///// ///// ///// /////

// HULPJES VAN MAAKDAGENDB()

function pakDagenVerzameling(start, end) {
  for (var arr = [], dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    arr.push(new Date(dt));
  }
  return arr;
}

function ISONaarRechtspraak(d) {
  let ds = typeof d === "string" ? d : d.toISOString();
  let dd = ds.split("T")[0];
  dd = dd.split("-");
  return dd.join("").padEnd(14, "0");
}
