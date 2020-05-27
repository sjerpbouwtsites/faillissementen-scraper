import {
  doeSpelVraag,
  marxInStorage,
  pakMarxCitaat,
} from "./frontend/ongein.js";
import { initMap, zetMarkers, zetMapInfo } from "./frontend/kaart.js";
import { gbody } from "./frontend/nuts.js";
import {
  zetOpenKvKPaneelEvent,
  setSluitKvKPaneelEvent,
  sluitKvKPaneel,
  zetKvKKnopEvent,
  zetKvkBladNavigatie,
} from "./frontend/kvk.js";

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
      const fail2 = await fetch("opslag/geconsolideerde-adressen.json");
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
  pakFaillissementen().then((faillissementen) => {
    zetMapInfo(faillissementen);
    zetMarkers(kaart, faillissementen);
    zetKvKKnopEvent(faillissementen);
    zetOpenKvKPaneelEvent(faillissementen);
    setSluitKvKPaneelEvent();
    zetKvkBladNavigatie();
    zetSluitAlles();
    sluitPaneelAlsPopupOpen();
  });
}

window.addEventListener("load", initFrontend);
