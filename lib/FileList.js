var testHarnessFiles = {
  // Vendors
  // always loads first
  // Order matters here!
  vendor: [
    "examples/vendor/js/lodash.min.js",
    "examples/vendor/js/jquery-2.0.2.min.js",
    "examples/vendor/js/angular/angular.min.js"
  ],
  // App-specific Code
  // Order matters here!
  app: [
    "build/infowrap-filepicker.min.js",
    "examples/js/app.js"
  ],
  test: [
    'node_modules/chai/chai.js',
    'test/lib/sinon-1.6.0.js',
    'test/lib/chai-should.js',
    'test/lib/chai-expect.js'
  ]
};

module.exports.files = testHarnessFiles
