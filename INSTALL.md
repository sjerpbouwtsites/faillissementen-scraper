# Dit is een vrij omslachtig proces.

Ik ga je leiden door het nabouwen van mijn dev omgeving.

## Windows Subsystem Linux

Als terminal en 'dev-os' gebruik ik Windows Subsystem Linux, Ubuntu. Dat is sowieso goed om te hebben. Al was het maar om vervolgens Apple-snobs een _echte_ Linux in het gezicht te wrijven met _correcte_ flags. Niet zoals die superdesign 40-jaar oude BSD ripoff 'MacOs'. Enfin zie [deze microsoft site](https://docs.microsoft.com/en-us/windows/wsl/install-win10) en als je vastloopt voor dat onderdelen verhaal zie [deze pagina](https://docs.microsoft.com/en-us/windows/nodejs/setup-on-wsl2)

Er zijn wat mogelijke momenten waarop dit in het verleden superlastig kon zijn. Dan installeerde je WSL en dan moet je in windows-onderdelen specifiek aanzetten 'windows subsystem linux' en dan kon je de Ubuntu applicatie draaien. Waarschijnlijk heeft Microsoft dit inmiddels wel rechtgezet. Bij problemen ff Sjerp berichten.

Let op. Dat Linux en Windows getrouwd zijn maakt nog niet dat ze hetzelfde zijn geworden. Het blijven twee OS'en.

## Node JS

De app is javascript aan de voor en achterkant. Installeer [NodeJS voor win10](https://nodejs.org/en/download/current/) en voor Ubuntu. Ga naar je terminal, als het goed is via `windows`-knop en `ubuntu`. Dan:

```bash
# interne lijsten bijwerken
sudo apt-get update;
# nodejs installeren
sudo apt-get install nodejs;
# package manager
sudo apt-get install npm;
# node versie manager erbij mikken
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash;
# resourcen terminal
source ~/.bashrc;
# controleer node versie
node -v
```

Voer ook in een powershell terminal `node -v` uit. Zijn in ieder geval de Major versie >= 11 en niet te verschillend? prima. Zo nee, gebruik dan NVM in je linux om de versies gelijk te krijgen `nvm install [major].[minor]`, of installeer in win10 de passende versie etc.

## Git

1. Ga naar github en maak een account aan.
2. [Installeer Git voor windows](https://git-scm.com/download/win)
3. Git in Linux. `sudo apt install git-all`.

### Git naam + wachtwoord telkens invoeren bij push is irritant.

Je kan een SSH key aanmaken (zowel win10 als ubuntu) en die toevoegen aan je github account. De volgende keer dat je inlogt is dan als het goed is de laatste.
Niet de moeite waard als je weinig met git gaat werken / je geen flauw idee heb van wat SSH Keys zijn.

## VS Code

Wat is nog beter dan Javascript en Windows10? Javascript en Microsoft in de populaire versie van Bill Gates' liefdesproject Visual Studio. Maximaal Microsoft!! ⚽⚽⚽
De texteditor is geschreven in een browser in javascript dus je schrijft je javascript in javascript waahhh!!
[installeer vs code](https://code.visualstudio.com/docs/setup/setup-overview).
Installeer dan in VS code de volgende extensies:

1. prettier
2. Remote - WSL
3. Babel Javascript
4. ESlint
5. Git history
6. Node.js Modules Intellisense
7. Terminal here
8. Live Server

## Sluit al je terminals en open ze opnieuw (PATH is veranderd)

## Download het project

1. Ga naar een map waar je je programmeerwerk opslaat
2. ```bash
   git clone https://github.com/sjerpbouwtsites/faillissementen-scraper;
   cd faillisementen-scraper;
   code ./
   ```

## Test de live server

Het project is nu geopend in VS code. Direct vanuit de filesystem een index.html openen kan prima in de browser, maar wegens _bla bla bla_ werken XHR requests niet direct op de fs. Daarom moet je gebruik maken van een 'live server'. Ga naar index.html met `[ctrl] [p] index [enter]` (of je muis) en rechterklik op de code. Onderaan het contextmenu dient 'open with live server' te staan. Als je nu iets aanpast in je broncode wordt de geladen app automatisch bijgewerkt (eat that niet geinterpreteerde talen). Als het goed is opent nu een kaart gecentreerd op Amsterdam Noord met verder niets. Correct, de backend moet nog draaien.

## Backend bedienen

### Configureer de applicatie

In config.js kan je start en einddata configureren voor de app. Zie `config.js`

### Beschikbare commando's

Zoals valt te lezen in package.json zijn dit de commando's

```"scripts": {
    "doe": "node index.js",
    "vanaf-begin": "npm run opruimen; node index.js",
    "opruimen": "clear; rm opslag/**/**/*.json opslag/**/*.json opslag/*.json",
    "vanaf-adressen": "clear; rm opslag/adressen.json; rm opslag/geconsolideerde-adressen.json; node index.js"
  },
```

(in de map van de applicatie...) Je draait ze met `npm run [naam]` zoals `npm run doe`.

- doe. Draait de backend met behoud van eerder data.
- vanaf-begin. Verwijderd alle data, reset de applicatie en draait de backend opnieuw.
- opruimen. Verwijderd alle data.
- vanaf-adressen. Legacy van tijdens bouwen.

Hou je terminal in de gaten voor feedback over het proces en/of kijk naar hoe JSONs geschreven worden naar de /opslag map.

### Waarom moet ik de app backend vaker draaien?

Omdat voortdurend nieuwe zaken gepubliceerd worden. Met het doe commando wordt slechts de delta gedaan.

## Wat een kutproject en wat een kutinstall

[fanmail hier](mailto:dev@sjerpbouwtsites.nl)
