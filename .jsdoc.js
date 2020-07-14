const packageJson = require('./package.json');

module.exports = {
  source: {
    include: ['./browser', './node', './shared'],
    includePattern: '.js$'
  },
  plugins: [
    'docdash/nativeTypesPlugin',
    'jsdoc-ts-utils',
    'plugins/markdown',
  ],
  templates: {
    cleverLinks: true,
    default: {
      includeDate: false
    }
  },
  opts: {
    recurse: true,
    destination: './docs',
    readme: 'README.md',
    tutorials: './documents',
    template: 'node_modules/docdash'
  },
  docdash: {
    title: packageJson.name,
    meta: {
      title: `${packageJson.name} docs`,
    },
    sectionOrder: [
      'Modules',
      'Tutorials',
    ],
    collapse: true,
    menu: {
      'GitHub': {
        href: `https://github.com/${packageJson.repository}`,
        target: '_blank',
      },
    },
  },
};