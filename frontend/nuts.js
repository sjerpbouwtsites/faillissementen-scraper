/**
 * standin voor document.getElementById
 * indien element niet gevonden, return false.
 */
export function gbi(a) {
  const w = document.getElementById(a);
  return typeof w !== "undefined" ? w : false;
}
