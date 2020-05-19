const correcteMeningen = [
  {
    tekst: "Vind je Friesland ook zo belangrijk?",
    naam: "friesland",
    wegsturenMet: "Maar suikerbrood dan 😥",
    wegsturenNaar: "https://www.youtube.com/watch?v=8mvHcJvdBE8",
    correcteAntwoord: true,
    antwoordGegeven: null,
  },
  {
    tekst: "Het is niet mooi.... maar Feyenoord doet wel altijd hun best.",
    wegsturenMet: "Foutieve mening ⚽",
    wegsturenNaar: "https://www.youtube.com/watch?v=_Z01TTEMtNA",
    naam: "voetbal-1",
    correcteAntwoord: false,
    antwoordGegeven: null,
  },
  {
    tekst: "Mathijs de Ligt had gewoon moeten blijven, die sukkel",
    wegsturenNaar: "https://www.youtube.com/watch?v=jejtIxSeV_4",
    wegsturenMet: "❌\n❌\n❌\n",
    naam: "voetbal-2",
    correcteAntwoord: true,
    antwoordGegeven: null,
  },
];

if (!sessionStorage.getItem("snaptHet")) {
  sessionStorage.setItem("snaptHet", JSON.stringify(correcteMeningen));
}

let faillissementen;
const eerdereAntwoorden = JSON.parse(sessionStorage.getItem("snaptHet"));

const spelVragen = eerdereAntwoorden.filter(
  (a) => !a.antwoordGegeven && a.antwoordGegeven !== a.correcteAntwoord
);
const spelVraagIndex = Math.ceil(Math.random() * (spelVragen.length - 1));
const spelVraag = spelVragen[spelVraagIndex];
if (Math.random() * 10 > 8 && typeof spelVraag !== "undefined") {
  spelVraag.antwoordGegeven = confirm(spelVraag.tekst);
  console.log(spelVraag.antwoordGegeven);
  if (spelVraag.correcteAntwoord === spelVraag.antwoordGegeven) {
    alert("🥰🥰🥰");
  } else {
    alert(spelVraag.wegsturenMet);
    location.href = spelVraag.wegsturenNaar;
  }
  eerdereAntwoorden.forEach((a) => {
    if (a.naam === spelVraag.naam) {
      a.antwoordGegeven = spelVraag.antwoordGegeven;
    }
  });
  sessionStorage.setItem("snaptHet", JSON.stringify(eerdereAntwoorden));
}

// if (!sessionStorage.getItem("marx-citaten")) {
//   fetch("opslag/marx.json")
//     .then((r) => r.json())
//     .then((marx) => {
//       sessionStorage.setItem("marx-citaten", JSON.stringify(marx));
//     });
// }

function pakMarxCitaat() {
  const m = JSON.parse(sessionStorage.getItem("marx-citaten"));
  if (!m) {
    return "";
  }
  const rIndex = Math.floor(Math.random() * m.length);
  return m[rIndex];
}

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
    zetMarkers(kaart);
    zetKvKKnopEvent(faillissementen);
  });
}

function haalKvkInfoEnPrint(kvkNummer, geheelNieuw = false, kvkNummers = []) {
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

      gbi("kvk-resultaat").innerHTML = kvkResponse.data;
      if (geheelNieuw) {
        gbi("kvk-nummers").innerHTML = `
          <li>KVK 🕵️‍♂️</li>
        ${kvkNummers
          .map((kvkNr) => {
            return `<li><button class='knopje' class='wissel-kvk' data-kvk-nr='${kvkNr}'>${kvkNr}</button></li>`;
          })
          .join("")}`;
        gbi("kvk-paneel").classList.add("groot");
        setTimeout(function () {
          gbi("kvk-paneel").classList.add("open");
        }, 350);
        setTimeout(function () {
          gbi("kvk-paneel").classList.remove("groot");
        }, 450);
      } // eind geheel nieuw
      else {
        gbi("kvk-resultaat").classList.remove("ladend");
      }
    }); // eind then exios KVK
  // #endregion axiosvk
}

function zetKvKKnopEvent(faillissementen) {
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

async function zetMarkers(kaart) {
  let faillissementen = await pakFaillissementen();

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
    console.log(kaart);
    console.log(marker);

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
zetOpenKvKPaneelEvent();

setSluitKvKPaneelEvent();

function zetOpenKvKPaneelEvent() {
  document.getElementsByTagName("body")[0],
    addEventListener("click", function (e) {
      if (e.target.hasAttribute("data-kvk-nr")) {
        haalKvkInfoEnPrint(e.target.getAttribute("data-kvk-nr"), false);
      }
    });
}

function initMap() {
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
function setSluitKvKPaneelEvent() {
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

function datediff(first, second) {
  // Take the difference between the dates and divide by milliseconds per day.
  // Round to nearest whole number to deal with DST.
  return Math.round((second - first) / (1000 * 60 * 60 * 24));
}

async function zetMapInfo() {
  return new Promise(async (resolve) => {
    let fail = await pakFaillissementen();
    let alleDatums = fail
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
    ).innerHTML = `${fail.length} faillissementsadressen uit de periode ${laagsteDatum} tot ${hoogsteDatum}`;
    resolve();
  });
}

/**
 * standin voor document.getElementById
 * indien element niet gevonden, return false.
 */
function gbi(a) {
  const w = document.getElementById(a);
  return typeof w !== "undefined" ? w : false;
}

window.addEventListener("load", initFrontend);
