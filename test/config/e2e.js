var path = require('path');
bbFiles = require(path.resolve('./FileList.js')).files

basePath = '../../';
files = []

files = files.concat(bbFiles.vendor)
files = files.concat(bbFiles.app)
files = files.concat(bbFiles.test)

files = files.concat([
  ANGULAR_SCENARIO,
  ANGULAR_SCENARIO_ADAPTER,
  'test/lib/custom-e2e-steps.js',
  'test/lib/custom-mocks.js',
  'test/e2e/**/*.js'
]);
