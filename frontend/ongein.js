function pakCorrecteMeningen() {
  return [
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
}

export function doeSpelVraag() {
  if (!sessionStorage.getItem("snaptHet")) {
    sessionStorage.setItem("snaptHet", JSON.stringify(pakCorrecteMeningen()));
  }

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
}

export function marxInStorage() {
  if (!sessionStorage.getItem("marx-citaten")) {
    fetch("marx.json")
      .then((r) => r.json())
      .then((marx) => {
        sessionStorage.setItem("marx-citaten", JSON.stringify(marx));
      });
  }
}

export function pakMarxCitaat() {
  const m = JSON.parse(sessionStorage.getItem("marx-citaten"));
  if (!m) {
    return "";
  }
  const rIndex = Math.floor(Math.random() * m.length);
  return m[rIndex];
}
