const { nutsPad } = require("./config.js");
const { pakScript, pakOpslag, legeCatch } = require(nutsPad);
const axios = require("axios");
const fs = require("fs");

// bij ophalen adres: draaien per adres;
// bij handmatig aanroepen

async function init() {
  const failAdressen = await pakOpslag("adressen");

  const wAdres = failAdressen[0];

  //#region axios kvk
  axios
    .get(
      `https://zoeken.kvk.nl/search.ashx?handelsnaam=&postcode=${encodeURIComponent(
        wAdres.postcode
      )}&huisnummer=${encodeURIComponent(
        wAdres.huisnummer
      )}&plaats=&hoofdvestiging=1&rechtspersoon=1&nevenvestiging=1&zoekvervallen=0&zoekuitgeschreven=1&start=0&error=false&searchfield=uitgebreidzoeken`
    )
    .then((kvkResponse) => {
      fs.writeFileSync("shit.html", kvkResponse.data);
    })
    .catch(legeCatch);
}

init();
