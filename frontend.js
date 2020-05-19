import {
  doeSpelVraag,
  marxInStorage,
  pakMarxCitaat,
} from "./frontend/ongein.js";
import { initMap, zetMarkers, zetMapInfo } from "./frontend/kaart.js";
import { gbi } from "./frontend/nuts.js";
import {
  zetOpenKvKPaneelEvent,
  setSluitKvKPaneelEvent,
  zetKvKKnopEvent,
} from "./frontend/kvk.js";

let faillissementen;

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

async function initFrontend() {
  const kaart = initMap();
  pakFaillissementen().then((faillissementen) => {
    zetMapInfo(faillissementen);
    zetMarkers(kaart, faillissementen);
    zetKvKKnopEvent(faillissementen);
    zetOpenKvKPaneelEvent(faillissementen);
    setSluitKvKPaneelEvent();
  });
}

window.addEventListener("load", initFrontend);
