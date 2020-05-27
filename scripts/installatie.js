const fs = require('fs');
const { opslagPad } = require('../config.js');

/**
 * locale helper om opslagpad te maken
 * @param {string} s 
 */
function pfo(s = '') {
  const ddd = `${opslagPad}/${s}`;
  console.log(ddd);
  return ddd;
}

/**
 * Controleert of alle opslag reeds bestaat
 */
function controleerInstallatie() {
  return new Promise((resolve, reject) => {
    const controleerOfMaak = [
      pfo(),
      pfo('responses'),
      pfo('responses/geo'),
      pfo('responses/rechtbank'),
      pfo('adressen')
    ];

    try {
      controleerOfMaak.forEach(opslagPad => {
        if (fs.existsSync(opslagPad)) {
          return
        }
        fs.mkdirSync(opslagPad);
      });
    } catch (error) {
      reject(error)
    }
    const giPad = pfo('.gitignore');
    const giTekst = '*.json';
    if (!fs.existsSync(pfo('.gitignore'))) {
      fs.writeFileSync(giPad, giTekst)
      console.log('maak', opslagPad)
    }
    resolve(true);
  });
}

module.exports = {
  controleerInstallatie,
}
