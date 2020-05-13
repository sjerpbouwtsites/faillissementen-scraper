const fs = require("fs");
const { opties, opslagPad } = require("../config.js");

function getDaysArray(start, end) {
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

function maakDagenDb() {
  return new Promise((resolve) => {
    console.log("maak dagen database");
    var daylist = getDaysArray(
      new Date(opties.startDatum),
      new Date(opties.eindDatum)
    );
    const dagenVoorDb = daylist.map((d) => {
      return {
        gescraped: false,
        geconsolideerd: false,
        adresGepakt: false,
        hadMelding: false,
        datum: d,
        route: ISONaarRechtspraak(d),
      };
    });
    fs.writeFileSync(
      opslagPad("dagenDb"),
      JSON.stringify(dagenVoorDb, null, "  ")
    );
    console.log("dagen database gemaakt");
    resolve(dagenVoorDb);
  });
}

function pakDagenData() {
  return new Promise(async (resolve) => {
    let dagenDb;
    let nieuweDb = !fs.existsSync(opslagPad("dagenDb"));
    if (nieuweDb) {
      dagenDb = await maakDagenDb();
    } else {
      dagenDb = JSON.parse(fs.readFileSync(opslagPad("dagenDb")));

      //@TODO
      // // mss moet de database aangevuld worden.
      // if (dagenDb[0].datum !== opties.startDatum || dagenDb[dagenDb.length - 1].datum !== opties.eindDatum) {
      //   // maak opnieuw nieuwe
      //   dagenDb = await maakDagenDb();
      //   nieuweDb = true;

      // }
    }

    // een nieuwe db heeft datumobjecten,
    // een reeds geschreven db heeft datumobjecten als string
    const vandaag = nieuweDb
      ? new Date()
      : Number(new Date().toISOString().split("T")[0].split("-").join(""));

    let dagenTeDoen = dagenDb.filter((dbDag) => {
      const vglMetVandaag = nieuweDb
        ? dbDag.datum
        : Number(dbDag.datum.split("T")[0].split("-").join(""));

      if (opties.negeerReedsGedaanBool) {
        return vglMetVandaag <= vandaag;
      } else {
        return !dbDag.gescraped && vglMetVandaag <= vandaag;
      }
    });
    let dagenTeConsolideren = dagenDb.filter((dbDag) => {
      return (
        dbDag.gescraped &&
        (!dbDag.geconsolideerd || opties.consolideerTelkensOpnieuw) &&
        dbDag.hadMelding &&
        dbDag.adresGepakt
      );
    });
    let dagenAdresTePakken = dagenDb.filter((dbDag) => {
      return (
        dbDag.gescraped &&
        !dbDag.geconsolideerd &&
        dbDag.hadMelding &&
        !dbDag.adresGepakt
      );
    });
    resolve({
      dagen: dagenDb,
      dagenTeDoen,
      dagenTeConsolideren,
      dagenAdresTePakken,
    });
  });
}

function printDagenFijn(dagenAr) {
  if (!dagenAr.hasOwnProperty("length") || typeof dagenAr !== "object") {
    console.log("kan niet printen...", dagenAr);
    return;
  }
  console.log("lengte ", dagenAr.length);
  dagenAr.forEach((d) => {
    console.log(
      "d: ",
      d.datum.split("T")[0],
      "gescraped:",
      d.gescraped,
      "geconsolideerd:",
      d.geconsolideerd,
      "hadMeldingen:",
      d.hadMelding
    );
  });
}

async function zetGescraped({ gescraped, hadMeldingen }) {
  return new Promise(async (resolve) => {
    const dagenData = await pakDagenData();

    const nweDagenData = dagenData.dagen.map((dbDag) => {
      const isGescraped = gescraped.some((g) => g.route === dbDag.route);
      const hadMelding = hadMeldingen.some((h) => h.route === dbDag.route);

      return {
        route: dbDag.route,
        gescraped: dbDag.gescraped || isGescraped,
        geconsolideerd: dbDag.geconsolideerd,
        adresGepakt: dbDag.adresGepakt,
        hadMelding: dbDag.hadMelding || hadMelding,
        datum: dbDag.datum,
      };
    });

    fs.writeFileSync(
      opslagPad("dagenDb"),
      JSON.stringify(nweDagenData, null, "  ")
    );
    resolve();
  });
}

async function schrijfAdressenGepakt(dagenAdresTePakken) {
  const dagenData = await pakDagenData();

  const nweDagenData = dagenData.dagen.map((dbDag) => {
    const adresGepakt = dagenAdresTePakken.some((h) => h.route === dbDag.route);

    return {
      route: dbDag.route,
      gescraped: dbDag.gescraped,
      geconsolideerd: dbDag.geconsolideerd,
      adresGepakt: dbDag.adresGepakt || adresGepakt,
      hadMelding: dbDag.hadMelding,
      datum: dbDag.datum,
    };
  });

  fs.writeFileSync(
    opslagPad("dagenDb"),
    JSON.stringify(nweDagenData, null, "  ")
  );
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

  fs.writeFileSync(
    opslagPad("dagenDb"),
    JSON.stringify(nweDagenData, null, "  ")
  );
}

function schrijfTemp(bla, achtervoeging = "") {
  fs.writeFileSync(
    `temp${achtervoeging}.json`,
    JSON.stringify(bla, null, "  ")
  );
}
module.exports = {
  schrijfTemp,
  pakDagenData,
  printDagenFijn,
  zetGescraped,
  schrijfAdressenGepakt,
  schrijfGeconsolideerd,
};
