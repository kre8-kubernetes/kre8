const awsHelperFunctions = {};


//** This function can live in a more global scope or
//** even be imported in from a file with helper functions, so that 
//** it can be used in other areas of our code base helpfunctions.js 

awsHelperFunctions.timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
} 

awsHelperFunctions.checkFileSystemForDirectoryAndMkDir = (folderName) => {
  if (fs.existsSync(process.env['HOME'] + `/.{folderName}`)) {
  } else {
    fs.mkdirSync(process.env['HOME'] + '/{folderName}'), (err) => {
      if (err) console.log("mkdir error", folderName, err);
    };  
  };
} 




module.exports = awsHelperFunctions;



// await new Promise((resolve, reject) => {
//   setTimeout(() => {
//     getStackData();
//     resolve();
//   }, 1000 * 1 * 60);
// })

// //TODO look into setInterval, and conside while loop. Reaname functoin
// await new Promise((resolve, reject) => {
//   const loop = () => {
//     if (stackStatus !== "CREATE_COMPLETE") {
//       setTimeout(() => {
//         getStackData();
//         loop();
//       }, 1000 * 30);
//     } else {
//       resolve();
//     }
//   }
//   loop();
// })
