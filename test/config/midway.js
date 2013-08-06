var path = require('path');
bbFiles = require(path.resolve('./FileList.js')).files

basePath = '../../';
files = []

files = files.concat(bbFiles.vendor)
files = files.concat(bbFiles.app)
files = files.concat(bbFiles.test)

files = files.concat([
  MOCHA,
  MOCHA_ADAPTER,
  'test/config/mocha.conf.js',

  //Test-Specific Code
  'vendor/js/ngMidwayTester/Source/ngMidwayTester.js',

  //Test-Specs
  'test/midway/**/*.coffee',
]);
