const fs = require("fs");
const { scriptPad, opslagPad } = require("./config.js");

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

function pakOpslag(subPad) {
  return new Promise((resolve, reject) => {
    const p = maakOpslagPad(subPad);
    if (!fs.existsSync(p)) {
      reject("bestand bestaat niet", p);
    } else {
      const b = fs.readFileSync(p);
      resolve(JSON.parse(b));
    }
  });
}

function legeCatch(err) {
  console.log(err);
}

function schrijfOpslag(pad, data) {
  let wpad = pad.includes("opslag") ? pad : maakOpslagPad(pad);
  fs.writeFile(wpad, JSON.stringify(data, null, "  "), () => {});
}

module.exports = {
  legeCatch,
  maakScriptPad,
  maakOpslagPad,
  pakScript,
  pakOpslag,
  schrijfOpslag,
};
