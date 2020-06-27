import { doeSpelVraag, marxInStorage, pakMarxCitaat } from "./ongein.js";
import { initMap, zetMarkers, zetMapInfo } from "./kaart.js";
import { gbody, toonVerbergElementen, nodeVerzameling, zetVerwerkSchakelKnopEvent } from "./nuts.js";
import { zetSluitOpenKnopEvenement } from "./sluit-open.js";
import { zetStijlen } from "./stijlen.js";
import {
  zetOpenKvKPaneelEvent,
  setSluitKvKPaneelEvent,
  sluitKvKPaneel,
  zetKvKKnopEvent,
  zetKvkBladNavigatie,
} from "./kvk.js";

let faillissementen;

export const huidigeFaillissementen = {
  faillisement: [],
  async zetHuidigeFaillissement(faillissementAdresObj) {
    this.faillisement = faillissementAdresObj;
  },

  pakHuidigeFaillissementen() {
    return this.faillisement;
  },
};

function pakFaillissementen() {
  return new Promise(async (resolve) => {
    if (!window["faillissementen"]) {
      const fail2 = await fetch("database/geconsolideerde-adressen.json");
      const fail3 = await fail2.json();
      window["faillissementen"] = fail3;
      resolve(fail3);
    } else {
      resolve(window["faillissementen"]);
    }
  });
}

function zetSluitAlles() {
  gbody().addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      sluitKvKPaneel();

      const sluitPopup = document.querySelector(".leaflet-popup-close-button");
      if (sluitPopup) {
        sluitPopup.click();
      }
    }
  });
}

function sluitPaneelAlsPopupOpen() {
  gbody().addEventListener("click", function(e) {
    if (e.target.classList.contains("leaflet-marker-icon")) {
      sluitKvKPaneel();
    }
  });
}

async function initFrontend() {
  const kaart = initMap();
  //zetStijlen();
  pakFaillissementen().then((faillissementen) => {
    zetMapInfo(faillissementen);
    zetMarkers(kaart, faillissementen);
    zetKvKKnopEvent(faillissementen);
    zetOpenKvKPaneelEvent(faillissementen);
    setSluitKvKPaneelEvent();
    zetKvkBladNavigatie();
    zetSluitAlles();
    sluitPaneelAlsPopupOpen();
    zetSluitOpenKnopEvenement();
    zetVerwerkSchakelKnopEvent();
    gbody().classList.add("geladen");
  });
}

window.addEventListener("load", initFrontend);
