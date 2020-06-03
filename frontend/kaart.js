import { gbi } from "./nuts.js";

export function initMap() {
  const mymap = L.map("mapid").setView([52.3948545, 4.9336231], 11);
  L.tileLayer(
    "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2plcnAtdmFuLXdvdWRlbiIsImEiOiJjajh5NmExaTAxa29iMzJwbDV0eXF4eXh4In0.HVBgF1SbusJzMwmjHcHS2w",
    {
      attribution:
        '<span id="map-info"></span> <strong>NOOOORD</strong>Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: "mapbox/streets-v11",
      tileSize: 512,
      zoomOffset: -1,
      accessToken: "your.mapbox.access.token",
    }
  ).addTo(mymap);
  return mymap;
}

/**
 *
 * @param {ISOstring} datum
 * @param {aantal dagen sinds faillissement waarop opacity 1} dagenLeegOptimaal
 * @param {milliseconden vandaag} vandaag
 */
function maakOpacity(datum, dagenLeegOptimaal, vandaag) {
  if (!datum) {
    return 0.5; // marker krijgt ook via alt attr oranje kleur
  }

  // faillissementsdatum
  const fDatum = new Date(datum).getTime();
  // dagen sinds faillissement
  const verschilInDagen = (vandaag - fDatum) / vandaag;
  // minimale opacity is 0.3
  return Math.max(verschilInDagen / dagenLeegOptimaal, 0.3);
}

export async function zetMarkers(kaart, faillissementen) {
  /**
   * Gebruikt in maak opacity.
   * Indien iets zo veel dagen leeg staat, krijgt de
   * marker opacity 1.
   */
  const dagenLeegOptimaal = 180;

  /**
   * vandaag in milliseconden
   */
  const vandaag = new Date().getTime() * 1000 * 3600 * 24;

  faillissementen.forEach((faillissement) => {
    // verder in het verleden opacity geven.

    const options = {
      opacity: maakOpacity(faillissement.datum, dagenLeegOptimaal, vandaag),
      alt: !faillissement.datum ? "geen-datum" : "",
    };

    const marker = L.marker(
      [faillissement.lat, faillissement.lon],
      options
    ).addTo(kaart);

    const bedrijfsNaamHTML = faillissement.bedrijfsNaam
      ? `<h4>${faillissement.bedrijfsNaam}</h4>`
      : "";
    const datumHTML = maakDatumHTML(faillissement.datum);

    marker.bindPopup(
      `<div class='leaflet-popup-publicatie'>
        <header class='leaflet-popup-header'>
          <span class='leaflet-popup-header-left'>
            ${datumHTML}
            ${bedrijfsNaamHTML}
          </span>
          <button class='open-kvk knopje' data-osm-id='${faillissement.osm_id}'>KvK paneel</button>
          </header>
          ${faillissement.publicaties}

        </div class='leaflet-popup-publicatie'>`
    );
  });
}
/**
 * helper van zetMarkers. Als datum bekend, return NL datum.
 * @param {datumstring} datum
 */
function maakDatumHTML(datum = false) {
  return datum
    ? `<h3>${new Date(datum).toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</h3>`
    : "Datum faillissement onbekend";
}

export async function zetMapInfo(faillissementen) {
  return new Promise(async (resolve) => {
    let alleDatums = faillissementen
      .map((f) => Number(f.datum.replace(/-/g, "999")))
      .filter((datum) => datum > 20209990199901);
    let hoogsteDatum = Math.max(...alleDatums)
      .toString()
      .replace(/[9]{3}/g, "-");
    let laagsteDatum = Math.min(...alleDatums)
      .toString()
      .replace(/[9]{3}/g, "-");
    gbi(
      "map-info"
    ).innerHTML = `${faillissementen.length} faillissementsadressen uit de periode ${laagsteDatum} tot ${hoogsteDatum}`;
    resolve();
  });
}
