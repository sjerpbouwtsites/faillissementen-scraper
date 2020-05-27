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
