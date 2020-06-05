var clc = require("cli-color");

/**
 * Indien een error is meegegeven wordt een mooi geformateerde stack trace geprint.
 * typische output
 * ```
 * --------------------
 * geLogdeVar
 * functieNaam                 /index.js                 19:16
 * functieNaam2                /index.js                  16:3
 * Object.<anonymous>          /index.js                  21:1
 * --------------------
 * ```
 * @param {*} teDebuggen 
 * @param {Error | any} errorVoorStack 
 */
function log(teDebuggen, errorVoorStack = false){
    
    if (errorVoorStack instanceof Error) {

        console.log(JSON.stringify(errorVoorStack))
        
        if (!errorVoorStack.hasOwnProperty('stack') || !!errorVoorStack.stack) {
            for (let v in errorVoorStack) {
                console.log(v)
            }
        }

        const stackTrace = errorVoorStack.stack
            .split(/[\r\n]/)
            .splice(1, 50)
            .map(a => a.trim().substring(3, 500))
            .filter(regel => {
                // alleen functies uit app
                return !['Module._compile', 'Object.Module', 'Module.load', 'Function.Module', 'Function.executeUser', 'internal/main'].map(magNietInRegel => {
                    return regel.includes(magNietInRegel)
                }).includes(true);
            }).map(regel => {
                const [,functienaam, bestand, regelEnKarakter] = regel.match(/(.*)\s.*(\/.*):(\d+:\d+)/)
                return `${functienaam.padEnd(25)}   ${bestand.padEnd(20)}   ${regelEnKarakter.padStart(8)}`;
            });

            console.log(''.padEnd(20, '-'))
            console.log(teDebuggen)
            stackTrace.forEach(regel => {
                console.log(clc.red(regel))
            });
            console.log(''.padEnd(20, '-'))
        
            } else {
                console.log(teDebuggen)
            }
    
}

module.exports = log