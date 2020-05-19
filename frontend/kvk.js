import { gbi } from "./nuts.js";
import { pakMarxCitaat } from "./ongein.js";

export function zetKvKKnopEvent(faillissementen) {
  document
    .getElementsByTagName("body")[0]
    .addEventListener("click", function (e) {
      if (e.target.classList.contains("open-kvk")) {
        e.target.setAttribute("disabled", true);
        const kvkNummers = faillissementen.find(
          (f) => f.osm_id === e.target.getAttribute("data-osm-id")
        ).kvk;

        if (!kvkNummers || !kvkNummers.length) {
          alert(
            "ik kon geen kvk nummer vinden. Of tenminste, me algoritme niet. Lag niet aan mij dus.😴"
          );
          return;
        }

        haalKvkInfoEnPrint(kvkNummers[0], true, kvkNummers);

        //data-osm-id
      }
      //open - kvk;
    });
}
export function haalKvkInfoEnPrint(
  kvkNummer,
  geheelNieuw = false,
  kvkNummers = []
) {
  if (!geheelNieuw) {
    gbi("kvk-resultaat").classList.add("ladend");
  }

  gbi("sluit-kvk-paneel").setAttribute("title", pakMarxCitaat());

  //#region axios kvk
  axios
    .get(
      `https://zoeken.kvk.nl/search.ashx?handelsnaam=&kvknummer=${kvkNummer}&straat=&postcode=&huisnummer=&plaats=&hoofdvestiging=1&rechtspersoon=1&nevenvestiging=1&zoekvervallen=0&zoekuitgeschreven=1&start=0&error=false&searchfield=uitgebreidzoeken&_=1589332056667`
    )
    .then((kvkResponse) => {
      setTimeout(() => {
        //disabled van knop afhalen

        const dis = document.querySelector(".open-kvk[disabled]");
        if (dis) {
          dis.removeAttribute("disabled");
        }
      }, 500);

      gbi("kvk-resultaat-nummers").innerHTML = kvkResponse.data;

      if (kvkNummers.length > 1) {
        gbi("kvk-resultaat-nummers").classList.add("heeft-kvk-nummers-lijst");
      } else {
        gbi("kvk-resultaat-nummers").classList.remove(
          "heeft-kvk-nummers-lijst"
        );
      }

      if (geheelNieuw) {
        if (kvkNummers.length > 1) {
          gbi("kvk-nummers").classList.remove("weg");
          gbi("kvk-nummers").innerHTML = `
          <li>KVK 🕵️‍♂️</li>
        ${kvkNummers
          .map((kvkNr) => {
            return `<li><button class='knopje' class='wissel-kvk' data-kvk-nr='${kvkNr}'>${kvkNr}</button></li>`;
          })
          .join("")}`;
        } else {
          gbi("kvk-nummers").classList.add("weg");
          gbi("kvk-nummers").classList;
        }

        gbi("kvk-paneel").classList.add("groot");
        setTimeout(function () {
          gbi("kvk-paneel").classList.add("open");
        }, 350);
        setTimeout(function () {
          gbi("kvk-paneel").classList.remove("groot");
        }, 450);
      } // eind geheel nieuw
      else {
        gbi("kvk-resultaat-nummers").classList.remove("ladend");
      }
    }); // eind then exios KVK
  // #endregion axiosvk
}

export function zetOpenKvKPaneelEvent() {
  document.getElementsByTagName("body")[0],
    addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-kvk-nr")) {
        haalKvkInfoEnPrint(e.target.getAttribute("data-kvk-nr"), false);
      }
    });
}

export function setSluitKvKPaneelEvent() {
  gbi("sluit-kvk-paneel").addEventListener("click", function () {
    gbi("sluit-kvk-paneel").classList.add("groot");

    // print marx citaat naar sluitknop
    if (Math.random() < 1) {
      // gbi("marquee").classList.add("beweeg");
      // gbi("marquee").classList.remove("verborgen");
      // console.log(gbi("marquee-binnen"));
      // gbi(
      //   "marquee-binnen"
      // ).innerHTML = pakMarxCitaat();
      // setTimeout(function () {
      //   gbi("marquee").classList.remove("beweeg");
      //   gbi("marquee").classList.add("verborgen");
      // }, 3500);
    }

    setTimeout(function () {
      gbi("kvk-paneel").classList.remove("open");
    }, 300);
    setTimeout(function () {
      gbi("sluit-kvk-paneel").classList.remove("groot");
    }, 500);
  });
}
