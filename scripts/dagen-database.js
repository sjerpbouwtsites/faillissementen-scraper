const fs = require("fs");
const { opties, nutsPad } = require("../config.js");
const { schrijfOpslag, maakOpslagPad, DateNaarDatumGetal } = require(nutsPad);

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
    var dagenLijst = pakDagenVerzameling(
      new Date(opties.startDatum),
      new Date(opties.eindDatum)
    );
    const dagenVoorDb = dagenLijst.map((d) => {
      return (ret = {
        datum: d,
        route: ISONaarRechtspraak(d), // API endpoint rechtbank
        gescraped: false, // van rechtbank;
        geconsolideerd: false, // adres en publicaties samengevoegd
        adresGepakt: false, // van locationIQ server latlng geplukt;
      });
    });
    schrijfOpslag("dagenDb", dagenVoorDb);
    console.log("dagen database gemaakt");
    resolve(dagenVoorDb);
  });
}

function pakDagenData() {
  return new Promise(async (resolve) => {
    // db wordt uit JSON gehaald of hier gemaakt
    let dagenDb;
    let makenGebruikVanNieuweDb = !fs.existsSync(maakOpslagPad("dagenDb"));
    if (makenGebruikVanNieuweDb) {
      dagenDb = await maakDagenDb();
    } else {
      dagenDb = JSON.parse(fs.readFileSync(maakOpslagPad("dagenDb")));
    }

    const vandaag = DateNaarDatumGetal(new Date());

    // 'te doen' zijn nog niet gescraped van de rechtbank en zijn vandaag of eerder.
    let dagenTeDoen = dagenDb.filter((dbDag) => {
      const vglMetVandaag = DateNaarDatumGetal(dbDag.datum);
      return !dbDag.gescraped && vglMetVandaag <= vandaag;
    });

    // Adres wordt vanaf locationIQ server gehaald na scrapen rechtbank
    let dagenAdresTePakken = dagenDb.filter((dbDag) => {
      return dbDag.gescraped && !dbDag.adresGepakt;
    });

    // samenvoegen van adressen en rechtbank responses
    // consolideerTelkensOpnieuw is eigenlijk een debugOptie
    let dagenTeConsolideren = dagenAdresTePakken.filter((dbDag) => {
      return !dbDag.geconsolideerd || opties.consolideerTelkensOpnieuw;
    });

    resolve({
      dagen: dagenDb,
      dagenTeDoen,
      dagenTeConsolideren,
      dagenAdresTePakken,
    });
  });
}

// apart gehouden want is snel verwarrend
async function zetGescraped({ gescraped }) {
  return new Promise(async (resolve) => {
    const dagenData = await pakDagenData();

    const nweDagenData = dagenData.dagen.map((dbDag) => {
      const isGescraped = gescraped.some((g) => g.route === dbDag.route);

      return Object.assign(dbDag, {
        gescraped: dbDag.gescraped || isGescraped,
      });
    });

    schrijfOpslag("dagenDb", nweDagenData);
    resolve();
  });
}

// waarom is de ene met een promise en de andere niet
async function schrijfAdressenGepakt(dagenAdresTePakken) {
  const dagenData = await pakDagenData();

  const nweDagenData = dagenData.dagen.map((dbDag) => {
    const adresGepakt = dagenAdresTePakken.some((h) => h.route === dbDag.route);
    return Object.assign(dbDag, {
      adresGepakt: dbDag.adresGepakt || adresGepakt,
    });
  });

  schrijfOpslag("dagenDb", nweDagenData);
}

async function schrijfGeconsolideerd(geconsolideerdDagen) {
  const dagenData = await pakDagenData();

  const nweDagenData = dagenData.dagen.map((dbDag) => {
    const isNieuwGeconsolideerd = geconsolideerdDagen.some(
      (h) => h.route === dbDag.route
    );
    return Object.assign(dbDag, {
      geconsolideerd: dbDag.geconsolideerd || isNieuwGeconsolideerd,
    });
  });

  schrijfOpslag("dagenDb", nweDagenData);
}

///// ///// ///// ///// ///// /////

module.exports = {
  schrijfTemp,
  pakDagenData,
  zetGescraped,
  schrijfAdressenGepakt,
  schrijfGeconsolideerd,
};

///// ///// ///// ///// ///// /////

// HULPJES VAN MAAKDAGENDB()

function pakDagenVerzameling(start, end) {
  for (
    var arr = [], dt = new Date(start);
    dt <= end;
    dt.setDate(dt.getDate() + 1)
  ) {
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
