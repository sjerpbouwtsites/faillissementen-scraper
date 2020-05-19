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

export async function zetMarkers(kaart, faillissementen) {
  const vandaag = new Date().getTime();
  const markers = faillissementen.map((faillissement) => {
    // verder in het verleden opacity geven.
    let opacity = 1;
    if (!!faillissement.datum) {
      const fDatum = new Date(faillissement.datum).getTime();
      // To calculate the no. of days between two dates
      var verschilInDagen = (fDatum - vandaag) / (1000 * 3600 * 24);
      const verschilNietBovenNul = Math.max(0, verschilInDagen) / 10;
      opacity = opacity - verschilNietBovenNul;
      opacity = Math.max(opacity, 0.3);
    }

    const marker = L.marker([
      faillissement.lat,
      faillissement.lon,
      {
        opacity: opacity,
      },
    ]).addTo(kaart);

    const datumHTML = faillissement.datum
      ? `<h3>${new Date().toDateString()}</h3>`
      : "";
    const bedrijfsNaamHTML = faillissement.bedrijfsNaam
      ? `<h4>${faillissement.bedrijfsNaam}</h4>`
      : "";

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
