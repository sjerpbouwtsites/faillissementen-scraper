const path = require("path");

const opslagPadHard = path.resolve("opslag/");
const scriptPadHard = path.resolve("scripts/");

function forceerSubpadMetSlash(sp) {
  const eersteTekenIsSlash = sp[0] === "/";
  return eersteTekenIsSlash ? sp : "/" + sp;
}

function forceerPostfix(sp, postFix) {
  return sp.includes(postFix) ? sp : `${sp}${postFix}`;
}

function scriptPad(subPad, postFix = ".js") {
  let gp = forceerSubpadMetSlash(subPad);
  gp = forceerPostfix(gp, postFix);
  return `${scriptPadHard}${gp}`;
}
function opslagPad(subPad, postFix = ".json") {
  let gp = forceerSubpadMetSlash(subPad);
  gp = forceerPostfix(gp, postFix);
  return `${opslagPadHard}${gp}`;
}

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
};
