/**
 * standin voor document.getElementById
 * indien element niet gevonden, return false.
 */
export function gbi(a) {
  const w = document.getElementById(a);
  return typeof w !== "undefined" ? w : false;
}

/**
 * return body
 */
export function gbody() {
  return document.getElementsByTagName("body")[0];
}

/**
 * om netwerk requests niet te snel te laten resolven en UI te laten flikkeren
 * @param string tijd. standaard 200ms
 */
export function vertragingsPromise(tijd = 500) {
  return new Promise((resolve) => {
    setTimeout(resolve(null), tijd);
  });
}

/**
 * return Array.from(document.querySelectorAll(selector))
 * @param {cssSelector string} selector
 */
export function nodeVerzameling(selector) {
  const e = document.querySelectorAll(selector);
  return Array.from(e);
}

/**
 * zet verborgen class op element of elementen
 * @param {boolean} toon
 * @param {HTMLElement | NodeList | HTMLElement[]} elementOfElementen
 */
export function toonVerbergElementen(toon, elementOfElementen) {
  if (typeof toon === "undefined") {
    throw new Error("toon verberg elementen vereist toon param");
  }
  if (!elementOfElementen) {
    return;
  }
  let lijst = [];
  if (elementOfElementen instanceof HTMLElement) {
    lijst = [elementOfElementen];
  } else if (elementOfElementen instanceof NodeList) {
    lijst = nodeVerzameling(elementOfElementen);
  } else {
    lijst = elementOfElementen;
  }
  console.log(toon, lijst);

  if (toon) {
    lijst.forEach((el) => {
      if (el.classList.contains("verborgen")) {
        el.classList.remove("verborgen");
      }
    });
  } else {
    // verberg
    lijst.forEach((el) => {
      if (!el.classList.contains("verborgen")) {
        el.classList.add("verborgen");
      }
    });
  }
}
