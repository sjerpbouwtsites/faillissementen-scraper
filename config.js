const path = require("path");

// noteren als JJJJ-MM-DD
// als je snel wilt testen neem een kleine tijdsspanne.Voorbeeld: 5 mei 2020 tot en met 7 mei 2020.
// als je de app uitgebreid wilt gebruiken zet dan een eindDatum ver in de toekomst. De app is intelligent genoeg om te weten welke datums nog niet geweest zijn
// rechtbankgegevens worden gepubliceerd sinds januari 2020.
const startDatum = "2020-01-01";
const eindDatum = "2020-12-31";

const opslagPad = path.resolve("opslag/");
const scriptPad = path.resolve("scripts/");
const nutsPad = path.resolve("nuts/");
const tempPad = path.resolve("temp/");
const maanden = [
  "",
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];
module.exports = {
  opties: {
    overschrijfAlleRequest: false,
    consolideerTelkensOpnieuw: true,
    startDatum,
    eindDatum,
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
  maanden,
};
