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

export function zetVerwerkSchakelKnopEvent(){
  gbody().addEventListener('click', verwerkSchakelKnopje);
}

/**
 * Een schakelknopje heeft de css-klas schakel-knopje. 
 * Het moet het attribute data-doel hebben. Alles in deze CSS selector wordt getoond 
 * indien schakel niet eerder gebruikt.
 * Alle in data-anti wordt verborgen indien schakel niet eerder gebruikt.
 * 
 * @param {} klikEvent 
 */
function verwerkSchakelKnopje(klikEvent){

    // je weet hoe het gaat met kliks, die vliegen soms raar.
    const isSchakelKnopje = klikEvent.target.classList.contains('schakel-knopje');
    const kindIsSchakelKnopje = klikEvent.target.children && klikEvent.target.children.length > 0 && klikEvent.target.children[0].classList.contains('schakel-knopje');
    const ouderIsSchakelKnopje = klikEvent.target.parentNode && klikEvent.target.parentNode.classList.contains('schakel-knopje');
    if (!isSchakelKnopje && !kindIsSchakelKnopje && !ouderIsSchakelKnopje) {
      return false;
    }

    const knopElement = isSchakelKnopje ? klikEvent.target 
      : kindIsSchakelKnopje ? klikEvent.target.children[0]
        : ouderIsSchakelKnopje ? klikEvent.target.parentNode
          : null
    

    
    if (!knopElement.hasAttribute('data-doel')){
      console.warn('schakel knop zonder data-doel', knopElement);
    }

    // als de schakel eerder gebruikt is heeft het het attribuut data-gebruikt
    // indien reeds gebruikt, draai toon / verberg logica om
    const reedsGebruikt = knopElement.hasAttribute('data-gebruikt');

    const doelElement = nodeVerzameling(knopElement.getAttribute('data-doel'));
    toonVerbergElementen(!reedsGebruikt, doelElement);

    if (knopElement.hasAttribute('data-anti')) {
      const verbergElementen = nodeVerzameling(knopElement.getAttribute('data-anti'));
      toonVerbergElementen(reedsGebruikt, verbergElementen);    
    }

    if (!reedsGebruikt) {
      knopElement.setAttribute('data-gebruikt', 'true');
    } else {
      knopElement.removeAttribute('data-gebruikt', 'true');
    }
    

}