function simpeleStijl(url) {
  return {
    href: `stijl/${url}.css`,
  };
}

export function zetStijlen() {
  const head = document.querySelector("head");
  const stijlen = [
    {
      href: "https://unpkg.com/leaflet@1.6.0/dist/leaflet.css",
      integrity:
        "sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ==",
      crossorigin: "",
    },
    {
      href:
        "http://yui.yahooapis.com/3.18.1/build/cssnormalize/cssnormalize-min.css",
    },
    simpeleStijl("stijl"),
    simpeleStijl("kvk-paneel"),
    simpeleStijl("kvk-response"),
    simpeleStijl("uitleg-paneel"),
    simpeleStijl("open-sluit"),
    simpeleStijl("leaflet"),
  ];
  stijlen.forEach((stijl) => {
    const linkEl = document.createElement("link");
    linkEl.rel = "styleheet";
    linkEl.href = stijl.href;
    if (stijl.integrity) {
      linkEl.integrity = stijl.integrity;
    }
    if (typeof stijl.crossorigin !== "undefined") {
      linkEl.crossorigin = stijl.crossorigin;
    }
    console.log(stijl, linkEl);
    head.appendChild(linkEl);
  });
}
