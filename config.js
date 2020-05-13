const path = require("path");

const opslagPad = path.resolve("opslag/");
const scriptPad = path.resolve("scripts/");
const nutsPad = path.resolve("nuts/");
const tempPad = path.resolve("temp/");

module.exports = {
  opties: {
    negeerReedsGedaanBool: false,
    schrijfAlleRequestsWeg: true,
    overschrijfAlleRequest: false,
    consolideerTelkensOpnieuw: true,
    startDatum: "2020-01-01",
    eindDatum: "2022-12-31",
    volleDebug: false,
    toegestaneClusters: [
      "einde faillissementen",
      "uitspraken faillissement",
      "vereenvoudigde afwikkeling faillissementen",
      "surseances",
      "faillissementen",
      "neerlegging tussentijdse uitdelingslijst in faillissementen",
      "neerlegging slotuitdelingslijst in faillissementen",
    ],
    ontoegestaneClusters: [
      "rectificatie",
      "uitspraken schuldsanering",
      "zittingen in schuldsaneringen",
      "einde schuldsaneringen",
      "neerlegging slotuitdelingslijst in schuldsaneringen",
      "vervanging cur / bwv",
      "einde surseances",
      "uitspraken surseance",
      "schuldsaneringen",
      "zittingen in faillissementen",
    ],
  },
  scriptPad,
  opslagPad,
  nutsPad,
  tempPad,
};
