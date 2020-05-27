const fs = require("fs");
const { scriptPad, tempPad, opslagPad } = require("./config.js");

function forceerSubpadMetSlash(sp) {
  const eersteTekenIsSlash = sp[0] === "/";
  return eersteTekenIsSlash ? sp : "/" + sp;
}

function forceerPostfix(sp, postFix) {
  return sp.includes(postFix) ? sp : `${sp}${postFix}`;
}

function maakScriptPad(subPad, postFix = ".js") {
  let gp = forceerSubpadMetSlash(subPad);
  gp = forceerPostfix(gp, postFix);
  return `${scriptPad}${gp}`;
}
function maakOpslagPad(subPad, postFix = ".json") {
  let gp = forceerSubpadMetSlash(subPad);
  gp = forceerPostfix(gp, postFix);
  return `${opslagPad}${gp}`;
}

function pakScript(subPad) {
  let r;
  try {
    r = require(maakScriptPad(subPad));
  } catch (err) {
    console.log("script laden fout met ", subPad);
    console.log("\n\n");
    console.log(err);
  }
  return r;
}

function pakOpslag(subPad, moetBestaan = false) {
  if (typeof subPad !== "string") {
    throw new Error("geen string: " + JSON.stringify(subPad));
  }
  const p = maakOpslagPad(subPad);
  if (!fs.existsSync(p)) {
    if (moetBestaan) {
      throw new Error(
        "bestand bestaat niet" + typeof p === "string" ? p : JSON.stringify(p)
      );
    }
  } else {
    const b = fs.readFileSync(p);
    return JSON.parse(b);
  }
}

function legeCatch(err) {
  console.log(err);
}

function schrijfOpslag(pad, data) {

  let wpad = pad.includes("database") ? pad : maakOpslagPad(pad);
  fs.writeFileSync(wpad, JSON.stringify(data, null, "  "));
}

function schrijfTemp(bla, achtervoeging = "") {
  if (!fs.existsSync(tempPad)) {
    fs.mkdirSync(tempPad);
  }

  fs.writeFileSync(
    `tempPad${achtervoeging}.json`,
    JSON.stringify(bla, null, "  ")
  );
}

function DateNaarDatumGetal(dateObjectOfISOString) {
  if (typeof dateObjectOfISOString === "string") {
    return dateObjectOfISOString.split("T")[0].split("-").join("");
  } else {
    return dateObjectOfISOString
      .toISOString()
      .split("T")[0]
      .split("-")
      .join("");
  }
}

module.exports = {
  DateNaarDatumGetal,
  schrijfTemp,
  legeCatch,
  maakScriptPad,
  maakOpslagPad,
  pakScript,
  pakOpslag,
  schrijfOpslag,
};
