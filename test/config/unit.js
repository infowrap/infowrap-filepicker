var path = require('path');
testHarnessFiles = require(path.resolve('./FileList.js')).files

basePath = '../../';
files = []

files = files.concat(testHarnessFiles.vendor)
files = files.concat(testHarnessFiles.app)
files = files.concat(testHarnessFiles.test)

files = files.concat([
  MOCHA,
  MOCHA_ADAPTER,
  'test/config/mocha.conf.js',

  //Test-Specific Code
  'test/lib/angular/angular-mocks.js',

  //Test-Specs
  'test/unit/**/spec*.coffee',
]);




