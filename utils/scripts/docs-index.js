const fs = require('fs-extra');
const { Logger } = require('../../node/logger');
const packageInfo = require('../../package.json');

const logger = new Logger(packageInfo.name);
const file = 'README-esdoc.md';

fs.readFile('./README.md', 'utf-8')
.then((contents) => {
  const newContents = contents.replace(
    /(?:\.\/documents\/\w+\/(\w+)\.md)/ig,
    'manual/$1.html',
  );
  return fs.writeFile(`./${file}`, newContents);
})
.then(() => {
  logger.success(`The ${file} file has been successfully generated`);
})
.catch((error) => {
  logger.error(`The ${file} file couldn't be created`);
  logger.error(error);
});
