/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
const { Application } = require('spectron');
const { assert } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');

const electronBinary = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
const baseDir = path.join(path.join(__dirname, '..', 'src', 'main'));

console.log('electronBinary', electronBinary);
console.log('baseDir', baseDir);
// chai.should();
// chai.use(chaiAsPromised);

// console.log(path.join(__dirname, '../src/main/'));
// console.log(process.env);

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

describe('Application launch', function () {
  this.timeout(20000);

  const app = new Application({
    path: electronBinary,
    args: [baseDir],
  });

  before(() => app.start());

  after(() => app.stop());

  it('Shows an initial window', async () => {
    await app.client.waitUntilWindowLoaded();
    const count = await app.client.getWindowCount();
    assert.isAbove(count, 0);
  });

  // beforeEach(function () {
  //   return this.app.start();
  // });

  // beforeEach(function () {
  //   chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
  // });

  // afterEach(function () {
  //   if (this.app && this.app.isRunning()) {
  //     return this.app.stop();
  //   }
  // });

  // it('opens a window', function () {
  //   return this.app.client.waitUntilWindowLoaded()
  //     .getWindowCount().should.eventually.equal(1);
  // });
});
