const axios = require("axios");
axios
  .get(
    "https://zoeken.kvk.nl/search.ashx?handelsnaam=&kvknummer=61203017&straat=&postcode=&huisnummer=&plaats=&hoofdvestiging=1&rechtspersoon=1&nevenvestiging=1&zoekvervallen=0&zoekuitgeschreven=1&start=0&error=false&searchfield=uitgebreidzoeken&_=1589332056667"
  )
  .then((response) => {
    console.log(response.data);
  })
  .catch((err) => {
    console.log(err);
  });
