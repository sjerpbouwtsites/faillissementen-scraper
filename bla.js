const fs = require('fs');
const path = require('path')
const config = require('./config.js');
const nuts = require(config.nutsPad)
const geoPath = nuts.maakOpslagPad('responses/geo', '');
console.log(geoPath)
console.log(fs.existsSync(geoPath))
const geos = fs.readdirSync(geoPath).map(fileName => {
    return path.join(geoPath, fileName)
  });

  console.log(geos);