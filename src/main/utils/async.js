/** --------- Timeout function blocks excution thread for ms Miliseconds ---
 * timeout() returns a promise that will will resolve after a number of milliseconds
 * that are passed in as an argument
 * @param {Number} ms milliseconds
 * @return {Promise}
*/
const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  timeout,
};
