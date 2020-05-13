# faillissementen-scraper

maakt een kaart met faillissementen
Louter voor educatieve doel einden - sla geen persoonsgegevens op.

## uitleg?

dev@sjerpbouwtsites.nl

## installeren zoals het er nu voorstaat.

De installatie is bijzonder eenvoudig zolang je je exact aan dit schema houdt

1. Wordt programmeur
2. Installeer superlinux in de terminal via dit supereenvoudige commando dat bij iedereen altijd werkt, vooral bij mij :dgfg;l gmd kg'jvsrevgfxdgfjgd;s/ke
3. Je ziet nu een dialoog. Klik op ok, ok, ok.

...
Enfin

Je hebt nodig **momenteel**:

1. NodeJS. https://nodejs.org/en/download/
2. Git. Of tenminste, wel makkelijk voor installeren.
3. een terminal zoals Windows' Linux, powershell of cmd. Maar dan alleen Linux want ik heb commando's geschreven voor de resetter die alleen werken in Linux. Daar kan je het volgende doen:
   `cd "/mnt/c//Users/Sjerp van Wouden/Desktop"; git clone https://github.com/sjerpbouwtsites/faillissementen-scraper faillissementen-2; cd faillissementen-2; npm install; npm run met-reset`;
   En dus eigenlijk alleen in windows' Linux, niet linux linux. 😣
   Voor windows kan je de de volgende mappen legen of bestanden weggooien om ook een reset te veroorzaken:
   opslag/responses/geo
   opslag/responses/kvk
   opslag/adressen.json
   opslag/dagenDb.json
   opslag/geconsolideerde-adressen.json
   opslag/ratelimit-adressen.json

voor windows volg je `git clone https://github.com/sjerpbouwtsites/faillissementen-scraper faillissementen-2; cd faillissementen-2; npm install;` en daarna gooi je die mappen / bestanden weg. Maar idealiter zet ik gewoon iets direct installeerbaars online 😇

4. Nu moet je in een terminal in de map komen waar je hebt geinstalleerd, zoals in dit geval faillissementen-2. Als het goed is zie je dat terug in je huidige directory in je terminal.
5. Draai het commando `node index.js` en de app gaat langzaam zichzelf vullen. Dit duurt wel even.
6. Ondertussen mag je je gaan ergeren aan mijn opzet om met een devserver te werken. Dat wilt zeggen dat ik m'n computer een server laat emuleren waarin ik de appvoorkant draai. Het makkelijkst is misscien VS code te installeren en hierbij in de map met de code een addon te gebruiker die 'm in een life server zet. Dat, of je kan https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/development_environment hier leren hoe je een server bouwt.

... ok wie vast loopt kan zich melden!
