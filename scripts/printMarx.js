const { nutsPad, goedPad } = require("../config");
const nuts = require(nutsPad);
var clc = require("cli-color");
const fs = require("fs");


async function print() {
  console.log(
    clc.red.bgBlack(
      `
                                                          
                                                          
             !#########       #                           
           !########!          ##!                        
         !########!               ###                     
      !##########                  ####                   
     ######### #####                ######                
      !###!      !####!              ######               
        !           #####            ######!              
                      !####!         #######              
                        #####       #######               
                          !####!   #######!               
                             ####!########                
             ##                   ##########              
           ,######!          !#############               
         ,#### ########################!####!             
       ,####'     ##################!'    #####           
     ,####'            #######              !####!        
     ####'                                      #####     
    ~##                                          ##~      
                                                          
                                                          
`
    )
  );

    const marxCitaten = JSON.parse(fs.readFileSync(`${goedPad}/marx.json`));
  const randIndex = Math.floor(Math.random() * marxCitaten.length);

  const citaat = marxCitaten[randIndex];
  const citaatOpgeknipt = [];
  let citaatTnt = "";
  citaat.split(" ").forEach((c, index) => {
    citaatTnt += c;
    opknipIndex = Math.floor(citaatTnt.length / 45);
    const eerder = typeof citaatOpgeknipt[opknipIndex] !== "undefined" ? citaatOpgeknipt[opknipIndex] : "";
    citaatOpgeknipt[opknipIndex] = eerder + " " + c;
  });

  console.log(" Gratis Marx citaat");
  console.log(clc.bgRed.black(citaatOpgeknipt.join("\n")));
}

module.exports = {
  print,
};
