var ExampleApp = angular.module("ExampleApp", ["infowrapFilepicker"]);

ExampleApp.value("infowrapFilepicker.config", {
    apiKey: "AQixW1s8yRrqymYokyC3Oz",
    iframeContainer:'filepicker-modal-container',
    isMobile:false,
    debugLogging:true,
    useSecurity:false,
    signApiUrl:function(resourceId) {
      return "http://yourserver.com/wraps/" + resourceId + "/file_assets/sign.json";
    },
    pickOptions: {
      debug:false,
      container: 'filepicker-modal',
      maxSize: 2000 * 1024 * 1024,
      services: ['COMPUTER', 'FACEBOOK', 'DROPBOX', 'BOX', 'GMAIL', 'GOOGLE_DRIVE', 'IMAGE_SEARCH', 'URL', 'INSTAGRAM', 'EVERNOTE', 'FLICKR', 'FTP', 'GITHUB',  'PICASA', 'WEBCAM', 'WEBDAV']
    }
  }
);

ExampleApp.run(function($rootScope, infowrapFilepickerService) {
  $rootScope.modalClose = function() {
    $rootScope.$broadcast(infowrapFilepickerService.events.modal.close);
  };

  $rootScope.$on(infowrapFilepickerService.events.pickedFiles, function(e, files) {
    $rootScope.files = files
  });
});
