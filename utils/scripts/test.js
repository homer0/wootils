const { JestExRunner } = require('jest-ex');
const { Logger } = require('../../node/logger');
const packageInfo = require('../../package.json');

const logger = new Logger(packageInfo.name);

new JestExRunner('./.jestrc.json', {
  addTransformer: true,
  addStubs: true,
  cache: false,
})
.run()
.then(() => logger.success('Yay! all the unit tests passed!'))
.catch(() => {
  logger.error('Damn... something went wrong with the unit tests');
  // eslint-disable-next-line
  process.exit(1);
});
