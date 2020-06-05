import { gbody, nodeVerzameling, toonVerbergElementen } from "./nuts.js";

/**
 * Generiek functie voor toon/sluit knoppen. vereist data-toon en data-sluit
 */
export function zetSluitOpenKnopEvenement() {
  gbody().addEventListener("click", function(e) {
    if (
      !e.target.classList.contains("open-sluit-knop") &&
      !e.target.parentNode.classList.contains("open-sluit-knop")
    ) {
      return;
    }
    const knop = e.target.classList.contains("open-sluit-knop")
      ? e.target
      : e.target.parentNode;

    if (!knop.hasAttribute("data-sluit") || !knop.hasAttribute("data-toon")) {
      console.error("sluit toon knop heeft mogelijk niet vereiste attributen.");
    }

    toonVerbergElementen(
      false,
      nodeVerzameling(knop.getAttribute("data-sluit"))
    );
    toonVerbergElementen(true, nodeVerzameling(knop.getAttribute("data-toon")));
  });
}
