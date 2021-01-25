const path = require('path');
const fs = require('fs-extra');
const packageJson = require('../../package.json');
const tsConfig = require('../../tsconfig.json');

/**
 * @typedef {Object} FileInfo
 * @property {string} filepath  The absolute path to the file.
 * @property {string} filename  The name of the file.
 */

/**
 * @typedef {Object} TypesFilesDictionary
 * @property {string}     target  The name of the target the types are for (like `browser`
 *                                or `node`).
 * @property {FileInfo[]} files   The list of the files with type declarations.
 */

/**
 * Loads all the type declaration files for a target.
 *
 * @param {string} target    The name of the target the types are for (like `browser` or
 *                           `node`).
 * @param {string} typePath  The path of the type files.
 * @returns {Promise<TypesFilesDictionary>}
 */
const loadFilesToCopy = async (target, typePath) => {
  let files = await fs.readdir(typePath);
  files = files
    .filter((file) => file.match(/\.d\.ts$/))
    .map((file) => ({
      filepath: path.join(typePath, file),
      filename: file,
    }));

  return { target, files };
};
/**
 * Copies a types file and fixes any path to reference files it may contain.
 *
 * @param {string} filepath        The path to the types file.
 * @param {string} destination     The path where the file should be copied to.
 * @param {string} distanceToRoot  The distance from the new path to the root. This is
 *                                 needed in order to replace paths to `@types`'
 *                                 references.
 * @returns {Promise<any>}
 */
const processFile = async (filepath, destination, distanceToRoot) => {
  let contents = await fs.readFile(filepath, 'utf-8');
  contents = contents.replace(
    /(<reference path=")[\.\/]+(\/@types)/gi,
    `$1${distanceToRoot}$2`,
  );
  return fs.writeFile(destination, contents);
};

(async () => {
  const { cjs2esm } = packageJson.config;
  const targets = cjs2esm.input;
  const esmDir = cjs2esm.output || 'esm';
  const typesDir = tsConfig.compilerOptions.outDir;
  const cwd = process.cwd();
  const typesPath = path.join(cwd, typesDir);
  const esmPath = path.join(cwd, esmDir);
  const destinationsByTarget = targets
    .map((target) => {
      const targetSrcPath = path.join(cwd, target);
      const targetSrcDistance = path.relative(targetSrcPath, cwd);
      const targetEsmPath = path.join(esmPath, target);
      const targetEsmDistance = path.relative(targetEsmPath, cwd);

      return {
        target,
        paths: [
          {
            path: targetSrcPath,
            distance: targetSrcDistance,
          },
          {
            path: targetEsmPath,
            distance: targetEsmDistance,
          },
        ],
      };
    })
    .reduce((acc, item) => ({ ...acc, [item.target]: item.paths }), {});

  let typesByTarget = await Promise.all(
    targets.map((target) => loadFilesToCopy(target, path.join(typesPath, target))),
  );
  typesByTarget = typesByTarget.reduce(
    (acc, info) => ({
      ...acc,
      [info.target]: info.files,
    }),
    {},
  );

  await Promise.all(
    targets.map((target) => {
      const files = typesByTarget[target];
      const destinations = destinationsByTarget[target];

      return Promise.all(
        destinations.map((dest) =>
          Promise.all(
            files.map((file) =>
              processFile(
                file.filepath,
                path.join(dest.path, file.filename),
                dest.distance,
              ),
            ),
          ),
        ),
      );
    }),
  );
})();
