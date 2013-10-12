var infowrapFilepicker;

angular.module("infowrapFilepicker.config", []).value("infowrapFilepicker.config", {});

/**
* @ngdoc module
* @name infowrapFilepicker
* @requires infowrapFilepicker.config
* @description
*
* The primary module which needs to be injected into your application to provide filepicker services and directives.
*
*/


infowrapFilepicker = angular.module("infowrapFilepicker", ["infowrapFilepicker.config"]);

/**
* @ngdoc object
* @name infowrapFilepicker.service:infowrapFilepickerService
* @requires $log
* @requires $window
* @requires $q
* @requires $rootScope
* @requires $timeout
* @description
*
* FilepickerService is responsible for exposing filepicker's api to your angular app.
*
* Currently, only a basic subset of their api is implemented.
* However, in the future we would like for this service to be configurable to implement only the api's you need/use.
*
* Feel free to issue a pull request if you find yourself motivated to flush out all the implementations.
* For a complete list of filepicker api calls, see <a href="https://developers.inkfilepicker.com/docs/web/" target="_blank">filepicker's documentation</a>.
*
*/


infowrapFilepicker.factory("infowrapFilepickerService", [
  "infowrapFilepicker.config", "infowrapFilepickerSecurity", "$log", "$window", "$q", "$rootScope", "$timeout", function(config, fps, $log, $window, $q, $rootScope, $timeout) {
    var allEvents, api, apiMethods, defaultPickOptions, eventPrefix, helperEvents, modalEvents, pickOptions, preparePickOptions;
    api = {};
    /**
    * @doc method
    * @name infowrapFilepicker.service:infowrapFilepickerService#loadFilepicker
    * @methodOf infowrapFilepicker.service:infowrapFilepickerService
    * @description
    *
    * Loads the filepicker javascript library.
    *
    * @returns {object} promise - gets resolved when filepicker library is loaded
    *
    */

    api.loadFilepicker = function() {
      var checkIfLoaded, defer;
      defer = $q.defer();
      $('body').append('<script type="text/javascript" src="//api.filepicker.io/v1/filepicker.js"></script>');
      checkIfLoaded = function() {
        if (_.isUndefined($window.filepicker)) {
          return $timeout(function() {
            return checkIfLoaded();
          }, 50);
        } else {
          return defer.resolve();
        }
      };
      checkIfLoaded();
      return defer.promise;
    };
    /**
    * @doc method
    * @name infowrapFilepicker.service:infowrapFilepickerService#log
    * @methodOf infowrapFilepicker.service:infowrapFilepickerService
    * @description
    *
    * Basic utility to provide debug logging for the module.
    *
    * @param {string} message - the message to log to output
    * @param {string} type (error, info, etc)
    *
    */

    api.log = function(msg, type) {
      if (config.debugLogging) {
        if (type) {
          return $log[type](msg);
        } else {
          return $log.log(msg);
        }
      }
    };
    api.events = {};
    eventPrefix = "infowrapFilepicker";
    apiMethods = ["pick", "pickAndStore", "exportFile", "read", "stat", "write", "writeUrl", "store", "convert", "remove"];
    helperEvents = ["pickedFiles", "error", "readingFiles", "readingFilesComplete", "readVCard", "readProgress", "resetFilesUploading", "progress", "storeProgress", "writeUrlProgress", "uploadProgress", "uploadsComplete"];
    allEvents = apiMethods.concat(helperEvents);
    modalEvents = ["close"];
    api.events.modal = {};
    _.forEach(modalEvents, function(event) {
      return api.events.modal[event] = ("" + eventPrefix + ":modal:") + event;
    });
    _.forEach(allEvents, function(event) {
      api.events[event] = ("" + eventPrefix + ":") + event;
      if (_.contains(apiMethods, event)) {
        return api[event] = function() {
          return api.log("" + event + " needs implementation!", "error");
        };
      }
    });
    defaultPickOptions = {
      container: "modal",
      maxSize: 5 * 1024 * 1024
    };
    pickOptions = _.extend(defaultPickOptions, config.pickOptions);
    preparePickOptions = function(opt) {
      var options;
      opt = opt || {};
      opt.multiple = opt.hasOwnProperty('multiple') ? opt.multiple : true;
      options = _.clone(pickOptions, true);
      _.extend(options, opt);
      return options;
    };
    /**
    * @doc method
    * @name infowrapFilepicker.service:infowrapFilepickerService#positionModal
    * @methodOf infowrapFilepicker.service:infowrapFilepickerService
    * @description
    *
    * When using iframe container, this will center the modal on screen.
    *
    */

    api.positionModal = function() {
      var $iframeContainer, $win, h, height, left, positionSettings, top, w, width;
      if (config.iframeContainer) {
        $iframeContainer = $("#" + config.iframeContainer);
        $win = angular.element($window);
        h = $win.outerHeight(true);
        if (config.isMobile) {
          top = left = 0;
          width = '100%';
          height = "" + (h + 60) + "px";
        } else {
          w = $win.outerWidth(true);
          width = "" + w + "px";
          height = "" + h + "px";
          top = 50;
          left = w / 2 - $iframeContainer.width() / 2;
          if (left < 0) {
            left = 0;
          }
        }
        positionSettings = {
          top: "" + top + "px",
          left: "" + left + "px"
        };
        if (config.isMobile) {
          _.extend(positionSettings, {
            width: width,
            height: height
          });
        }
        return $iframeContainer.css(positionSettings);
      }
    };
    /**
    * @doc method
    * @name infowrapFilepicker.service:infowrapFilepickerService#modalToggle
    * @methodOf infowrapFilepicker.service:infowrapFilepickerService
    * @description
    *
    * Toggle on/off the picker modal.
    *
    * This also sets up ESC key listener to close the modal as well as window resize to reposition modal.
    *
    */

    api.modalToggle = function(force) {
      var $body, $win, enabled, handleEscapeKey, handleModalPosition;
      enabled = _.isUndefined(force) ? !$rootScope.filepickerModalOpen : force;
      $rootScope.filepickerModalOpen = enabled;
      $rootScope.safeApply();
      handleEscapeKey = function(e) {
        if (e.which === 27) {
          e.preventDefault();
          if ($rootScope.filepickerModalOpen) {
            return $rootScope.safeApply(function() {
              return api.modalToggle(false);
            });
          }
        }
      };
      handleModalPosition = function(e) {
        if ($rootScope.filepickerModalOpen) {
          return api.positionModal();
        }
      };
      $body = angular.element('body');
      $win = angular.element($window);
      if (enabled) {
        $body.bind('keydown', handleEscapeKey);
        $win.bind('resize', handleModalPosition);
        return $timeout(function() {
          return $win.scrollTop(0);
        }, config.isMobile ? 300 : 0);
      } else {
        $body.unbind('keydown', handleEscapeKey);
        return $win.unbind('resize', handleModalPosition);
      }
    };
    /**
    * @doc method
    * @name infowrapFilepicker.service:infowrapFilepickerService#pick
    * @methodOf infowrapFilepicker.service:infowrapFilepickerService
    * @description
    *
    * This combines `pick` and `pickMultiple`.
    *
    * They are combined here for simplicity and code reduction.
    * The `options` parameter defaults `multiple:true`, so it will call `pickMultiple` by default.
    * However, pass in multiple:false to limit the picker to just one file selection.
    *
    * @param {object} options - see filepicker docs [here](https://developers.inkfilepicker.com/docs/web/#pick) to learn more.
    */

    api.pick = function(opt) {
      var defer, onError, onSuccess;
      defer = $q.defer();
      opt = preparePickOptions(opt);
      api.log(opt);
      api.modalToggle(true);
      onSuccess = function(fpfiles) {
        return $rootScope.safeApply(function() {
          api.modalToggle(false);
          return defer.resolve(fpfiles);
        });
      };
      onError = function(fperror) {
        api.log(fperror);
        return $rootScope.safeApply(function() {
          api.modalToggle(false);
          return defer.reject(fperror);
        });
      };
      if (opt.multiple) {
        filepicker.pickMultiple(opt, onSuccess, onError);
      } else {
        filepicker.pick(opt, onSuccess, onError);
      }
      $timeout(function() {
        return api.positionModal();
      }, 0);
      return defer.promise;
    };
    /**
    * @doc method
    * @name infowrapFilepicker.service:infowrapFilepickerService#pickAndStore
    * @methodOf infowrapFilepicker.service:infowrapFilepickerService
    * @description
    *
    * Filepicker's `pickAndStore`.
    *
    * @param {object} options - see filepicker docs [here](https://developers.inkfilepicker.com/docs/web/#pickAndStore) to learn more.
    */

    api.pickAndStore = function(opt) {
      var defer, onError, onSuccess, storeOptions;
      defer = $q.defer();
      opt = preparePickOptions(opt);
      api.log(opt);
      api.modalToggle(true);
      onSuccess = function(fpfiles) {
        return $rootScope.safeApply(function() {
          api.modalToggle(false);
          return defer.resolve(fpfiles);
        });
      };
      onError = function(fperror) {
        api.log(fperror);
        return $rootScope.safeApply(function() {
          api.modalToggle(false);
          return defer.reject(fperror);
        });
      };
      storeOptions = {
        location: 'S3',
        path: opt.path
      };
      filepicker.pickAndStore(opt, storeOptions, onSuccess, onError);
      $timeout(function() {
        return api.positionModal();
      }, 0);
      return defer.promise;
    };
    /**
    * @doc method
    * @name infowrapFilepicker.service:infowrapFilepickerService#writeUrl
    * @methodOf infowrapFilepicker.service:infowrapFilepickerService
    * @description
    *
    * Filepicker's `writeUrl`.
    *
    * @param {object} options - see filepicker docs [here](https://developers.inkfilepicker.com/docs/web/#writeUrl) to learn more.
    */

    api.writeUrl = function(targetFpFile, url, opt) {
      var cleanUrl, defer;
      defer = $q.defer();
      opt = opt || {};
      cleanUrl = _.first(url.split('?'));
      api.log(cleanUrl);
      filepicker.writeUrl(targetFpFile, cleanUrl, opt, function(fpfile) {
        return $rootScope.safeApply(function() {
          return defer.resolve(fpfile);
        });
      }, function(fperror) {
        api.log(fperror);
        return $rootScope.safeApply(function() {
          return defer.reject(fperror);
        });
      });
      return defer.promise;
    };
    /**
    * @doc method
    * @name infowrapFilepicker.service:infowrapFilepickerService#store
    * @methodOf infowrapFilepicker.service:infowrapFilepickerService
    * @description
    *
    * Filepicker's `store`.
    *
    * @param {object} options - see filepicker docs [here](https://developers.inkfilepicker.com/docs/web/#store) to learn more.
    */

    api.store = function(input, opt) {
      var cachedPolicy, defer, signOptions, storeFile;
      defer = $q.defer();
      storeFile = function(signedPolicy) {
        var options, result;
        result = {
          input: input
        };
        options = {
          policy: signedPolicy.encoded_policy,
          signature: signedPolicy.signature,
          path: signedPolicy.policy.path,
          location: 'S3'
        };
        return filepicker.store(input, options, function(data) {
          _.extend(result, {
            data: data
          });
          return $rootScope.safeApply(function() {
            return defer.resolve(result);
          });
        }, function(fperror) {
          api.log(fperror);
          _.extend(result, {
            error: fperror
          });
          return $rootScope.safeApply(function() {
            return defer.reject(result);
          });
        });
      };
      cachedPolicy = fps.getCachedPolicy({
        "new": true
      });
      if (cachedPolicy) {
        storeFile(cachedPolicy);
      } else {
        signOptions = {
          "new": true,
          wrapId: opt.wrapId
        };
        fps.sign(signOptions).then(function(signedPolicy) {
          return storeFile(signedPolicy);
        });
      }
      return defer.promise;
    };
    /**
    * @doc method
    * @name infowrapFilepicker.service:infowrapFilepickerService#export
    * @methodOf infowrapFilepicker.service:infowrapFilepickerService
    * @description
    *
    * Filepicker's `export`.
    *
    * @param {object} options - see filepicker docs [here](https://developers.inkfilepicker.com/docs/web/#export) to learn more.
    */

    api["export"] = function(input, opt, success, failure) {
      var defer;
      defer = $q.defer();
      opt = opt || {};
      fps.sign({
        id: input.id,
        "new": true
      }).then(function() {
        var newPolicy, options;
        newPolicy = fps.cachedPolicies["new"];
        options = {
          policy: newPolicy.encoded_policy,
          signature: newPolicy.signature
        };
        opt = _.extend(opt, options);
        return filepicker.exportFile(input.url.url, opt, function(data) {
          return $rootScope.safeApply(function() {
            return defer.resolve(data);
          });
        }, function(fperror) {
          api.log(fperror);
          return $rootScope.safeApply(function() {
            return defer.reject(fperror);
          });
        });
      });
      return defer.promise;
    };
    /**
    * @doc method
    * @name infowrapFilepicker.service:infowrapFilepickerService#read
    * @methodOf infowrapFilepicker.service:infowrapFilepickerService
    * @description
    *
    * Filepicker's `read`.
    *
    * `base64encode:true` is the default. Use this to read images.
    *
    * If you need to read text, pass in `asText:true`
    *
    * @param {object} input - The object to read. Can be an InkBlob, a URL, a DOM File Object, or a file input.
    * @param {object} options - see filepicker docs [here](https://developers.inkfilepicker.com/docs/web/#read) to learn more.
    */

    api.read = function(input, opt) {
      var defer, getUrlToReadFrom, readFile, signOptions, url, usingImage;
      defer = $q.defer();
      opt = opt || {
        base64encode: true
      };
      usingImage = opt.base64encode;
      readFile = function(url) {
        var existingPolicy, result;
        api.log("filepicker.read: " + url);
        existingPolicy = fps.cachedPolicies.existing;
        _.extend(opt, {
          policy: existingPolicy.encoded_policy,
          signature: existingPolicy.signature
        });
        result = {
          input: input
        };
        return filepicker.read(url, opt, function(data) {
          if (usingImage) {
            data = "data:image/png;base64," + data;
          }
          _.extend(result, {
            data: data
          });
          return $rootScope.safeApply(function() {
            defer.resolve(result);
            return $rootScope.$broadcast(api.events.read, result);
          });
        }, function(fperror) {
          api.log(fperror);
          _.extend(result, {
            error: fperror
          });
          return $rootScope.safeApply(function() {
            return defer.reject(result);
          });
        });
      };
      getUrlToReadFrom = function(input, options) {
        var url;
        url = input;
        if (_.isObject(input)) {
          if (options && _.isNumber(input.id)) {
            _.extend(options, {
              id: input.id
            });
          }
          if (_.isObject(input.url)) {
            url = input.url.url;
          } else {
            url = input.url;
          }
        }
        if (options && url.indexOf('policy') === -1) {
          _.extend(options, {
            handle: url
          });
        }
        return url;
      };
      signOptions = {};
      url = getUrlToReadFrom(input, signOptions);
      fps.sign(signOptions).then(function() {
        return readFile(url);
      });
      return defer.promise;
    };
    /*
    END filepicker api implementations
    */

    /*
    Helper functions and sweeteners
    */

    api.previewTargetLoad = function() {
      var $el;
      if (api.dropDomId) {
        $el = $("#" + api.dropDomId);
        return $el.addClass('loading-image');
      }
    };
    api.previewTargetReady = function(result, ignoreImgLoad) {
      var $el, cleanSrc, fieldName, target, targetImage;
      $el = $("#" + api.dropDomId);
      fieldName = $el.data('field-name');
      cleanSrc = void 0;
      cleanSrc = result.data.replace(/\n/g, "");
      if (!ignoreImgLoad) {
        targetImage = document.createElement("image");
        targetImage.onload = function() {
          $timeout(function() {
            $el.removeClass('loading-image');
            return $el.css({
              "background-image": "url(" + cleanSrc + ")"
            });
          }, 100);
          return targetImage.src = "";
        };
        targetImage.src = cleanSrc;
      }
      target = {
        fieldName: fieldName,
        data: _.extend(result.input, {
          id: _.uniqueId()
        })
      };
      return target;
    };
    api.readVCardData = function(input) {
      var defer;
      defer = $q.defer();
      if (input) {
        api.read(input, {
          asText: true
        }).then(function(readResult) {
          var result;
          result = {
            data: vCard.initialize(readResult.data),
            input: readResult.input
          };
          defer.resolve(result);
          return $rootScope.$broadcast(api.events.readVCard, result);
        });
      }
      return defer.promise;
    };
    api.readFiles = function(files, dropZone, preventDefault) {
      var cnt, continueReading, readFile;
      if (!preventDefault) {
        $rootScope.$broadcast(api.events.readingFiles);
      }
      if (!api.dropTargetField) {
        if (dropZone) {
          api.log("--------\nDropped on specific zone target!");
          api.log(dropZone);
          api.log("for: " + dropZone.data("for"));
        } else {
          cnt = 0;
          continueReading = function() {
            cnt++;
            if (cnt < files.length) {
              return readFile();
            } else {
              $rootScope.$broadcast(api.events.readingFilesComplete);
              return $rootScope.safeApply();
            }
          };
          readFile = function() {
            var file, fileName, fileType, result;
            file = files[cnt];
            fileName = file.name || file.filename;
            if (file.type !== 'file_asset') {
              fileType = file.type || file.mimetype || file.mime_type;
            } else {
              fileType = file.mime_type;
            }
            result = {
              input: file
            };
            api.log("---------\nReading file:");
            api.log(fileName + (" (" + fileType + ")"));
            if (fileType.search(/image\/(gif|jpeg|png|tiff)/) > -1) {
              fileType = "image";
            }
            switch (fileType) {
              case "text/directory":
                return api.readVCardData(file).then(function() {
                  return continueReading();
                });
              case "image":
                return api.read(file).then(function() {
                  return continueReading();
                });
              case "text/plain":
                continueReading();
                return $rootScope.$broadcast(api.events.read, _.extend(result));
              case "application/pdf":
                continueReading();
                return $rootScope.$broadcast(api.events.read, _.extend(result));
            }
          };
          readFile();
        }
      }
      return $rootScope.safeApply();
    };
    api.addToFilesUploading = function(files) {
      api.filesUploading = api.filesUploading.concat(_.flatten(files));
      return _.forEach(api.filesUploading, function(file) {
        return file.id = _.uniqueId(file.name || file.filename);
      });
    };
    api.setUploadProgress = function(data) {
      var percent;
      percent = Math.floor(data);
      api.log("Uploading (" + percent + "%)");
      api.uploadProgress = percent;
      api.uploadProgressStyle = {
        width: percent + "%"
      };
      if (percent > 25) {
        return $timeout((function() {
          var $fileStatus, rightOffset, totalWidth;
          $fileStatus = $(".file-status");
          totalWidth = $fileStatus.find(".upload-percentage").width();
          rightOffset = totalWidth - Math.floor(totalWidth * (percent * .01));
          return $fileStatus.find(".upload-percent-text").css({
            right: (rightOffset + 12) + "px"
          });
        }), 200);
      }
    };
    api.uploadProgressClasses = function() {
      if (api.filesUploading.length) {
        return "progress-striped active";
      } else {
        return "progress-info";
      }
    };
    api.addToFilesUploaded = function(files) {
      api.filesUploaded = api.filesUploaded.concat(_.flatten(files));
      _.forEach(api.filesUploaded, function(file) {
        if (!file.hasOwnProperty('created_at')) {
          return file.created_at = JSON.parse(JSON.stringify(new Date()));
        }
      });
      api.filesUploading = [];
      return $rootScope.uploadsInProgress = false;
    };
    api.clearFilesUploaded = function() {
      return api.filesUploaded = [];
    };
    api.resetFileStatus = function() {
      $rootScope.uploadsInProgress = false;
      api.usedFilePickerDialog = false;
      api.dropDomId = void 0;
      api.dropTargetId = void 0;
      api.dropTargetParentId = void 0;
      api.dropTargetType = void 0;
      api.dropTargetField = void 0;
      api.dropWindow = void 0;
      api.uploadProgress = 0;
      api.uploadProgressStyle = {
        width: "0px"
      };
      return api.filesUploading = api.filesUploaded = [];
    };
    api.resetFileStatus();
    return api;
  }
]);

/**
* @ngdoc object
* @name infowrapFilepicker.service:infowrapFilepickerSecurity
* @requires infowrapFilepickerService
* @requires $log
* @requires $q
* @requires $rootScope
* @requires $http
* @description
*
* FilepickerSecurity is an implementation of the security signing scheme devised by the Filepicker team.
*
* This security signing is setup to work directly with our ruby gem, <a href="https://github.com/infowrap/filepicker_client" target="_blank">filepicker_client</a>.
*
*
*/


infowrapFilepicker.factory("infowrapFilepickerSecurity", [
  "infowrapFilepicker.config", "$log", "$q", "$rootScope", "$http", function(config, $log, $q, $rootScope, $http) {
    var api, getOperations, signingInProcess;
    signingInProcess = false;
    getOperations = function(isNew) {
      if (isNew) {
        return api.operations["new"];
      } else {
        return api.operations.existing;
      }
    };
    api = {};
    api.cachedPolicies = {
      "new": {},
      existing: {},
      types: {}
    };
    api.operations = {
      "new": ['pick', 'store', 'storeUrl'],
      existing: ['read', 'stat', 'convert', 'write', 'writeUrl']
    };
    api.getCachedPolicy = function(opt) {
      var cachedPolicy, isCached, operations, rightNowEpoch;
      opt = opt || {};
      if (_.isUndefined(opt.signType)) {
        cachedPolicy = api.cachedPolicies[opt["new"] ? 'new' : 'existing'];
      } else {
        cachedPolicy = api.cachedPolicies.types[opt.signType];
        if (cachedPolicy) {
          cachedPolicy = api.cachedPolicies.types[opt.signType][opt["new"] ? 'new' : 'existing'];
        }
      }
      if (cachedPolicy && cachedPolicy.policy) {
        operations = getOperations(opt["new"]);
        isCached = _.find(cachedPolicy.policy.call, function(operation) {
          return _.contains(operations, operation);
        });
        if (isCached && cachedPolicy.policy.expiry) {
          rightNowEpoch = Math.floor(new Date().getTime() / 1000);
          if (rightNowEpoch <= Number(cachedPolicy.policy.expiry)) {
            return cachedPolicy;
          }
        }
      }
      return false;
    };
    api.sign = function(opt) {
      var activeWrapId, defer, signage;
      opt = opt || {};
      defer = $q.defer();
      signage = {
        options: {
          call: getOperations(opt["new"])
        }
      };
      if (opt.id) {
        _.extend(signage.options, {
          file_id: opt.id
        });
      }
      if (opt.handle) {
        _.extend(signage.options, {
          handle: opt.handle.substr(opt.handle.lastIndexOf('/') + 1)
        });
      }
      if (opt.size) {
        _.extend(signage.options, {
          file_size: opt.size
        });
      }
      activeWrapId = $rootScope.activeWrap ? $rootScope.activeWrap.id : void 0;
      opt.resourceId = opt.wrapId || activeWrapId;
      if (opt.signType === 'account') {
        opt.resourceId = opt.signTypeResourceId || $rootScope.currentUser.id;
      }
      if (!signingInProcess) {
        signingInProcess = true;
        $http.post(config.signApiUrl(opt.resourceId, opt.signType), signage).success(function(result) {
          var getSignedPolicy, updateSignTypePolicy;
          signingInProcess = false;
          if (config.debugLogging) {
            $log.log("--- filepicker security sign ---");
            $log.log(signage.options.call);
          }
          updateSignTypePolicy = function() {
            var cachedType;
            cachedType = api.cachedPolicies.types[opt.signType];
            if (_.isUndefined(cachedType)) {
              api.cachedPolicies.types[opt.signType] = {};
            }
            return api.cachedPolicies.types[opt.signType][opt["new"] ? 'new' : 'existing'] = result;
          };
          getSignedPolicy = function() {
            if (opt["new"]) {
              if (_.isUndefined(opt.signType)) {
                return api.cachedPolicies["new"] = result;
              } else {
                return updateSignTypePolicy();
              }
            } else {
              if (_.isUndefined(opt.signType)) {
                return api.cachedPolicies.existing = result;
              } else {
                return updateSignTypePolicy();
              }
            }
          };
          return defer.resolve(getSignedPolicy());
        }).error(function(result) {
          signingInProcess = false;
          if (result.error === 'filenotfound') {
            if (config.debugLogging) {
              $log.log(result.error);
            }
          }
          return defer.reject(result.error);
        });
      }
      $rootScope.safeApply();
      return defer.promise;
    };
    api.secureForReading = function(fpfiles, options) {
      var defer, fileCnt, signFile;
      defer = $q.defer();
      fileCnt = 0;
      signFile = function() {
        var file, signOptions;
        file = fpfiles[fileCnt];
        signOptions = {};
        if (options && options.id) {
          signOptions.id = file.id;
        } else {
          signOptions.handle = _.isObject(file.url) ? file.url.url : file.url;
        }
        if (options.signType) {
          signOptions.signType = options.signType;
        }
        if (options.signTypeResourceId) {
          signOptions.signTypeResourceId = options.signTypeResourceId;
        }
        return api.sign(signOptions).then(function() {
          var appendedSecurity, existingPolicy;
          if (_.isUndefined(signOptions.signType)) {
            existingPolicy = api.cachedPolicies.existing;
          } else {
            existingPolicy = api.cachedPolicies.types[signOptions.signType].existing;
          }
          appendedSecurity = "?signature=" + existingPolicy.signature + "&policy=" + existingPolicy.encoded_policy;
          if (_.isObject(file.url)) {
            file.url.url += appendedSecurity;
          } else {
            file.url += appendedSecurity;
          }
          fileCnt++;
          if (fileCnt === fpfiles.length) {
            return defer.resolve(fpfiles);
          } else {
            return signFile();
          }
        });
      };
      signFile();
      return defer.promise;
    };
    return api;
  }
]);

infowrapFilepicker.run([
  "infowrapFilepicker.config", 'infowrapFilepickerService', '$rootScope', '$window', function(config, fp, $rootScope, $window) {
    $rootScope.safeApply = function(fn) {
      var phase;
      phase = this.$root.$$phase;
      if (phase === "$apply" || phase === "$digest") {
        if (fn) {
          return $rootScope.$eval(fn);
        }
      } else if (fn) {
        return $rootScope.$apply(fn);
      } else {
        return $rootScope.$apply();
      }
    };
    if (config.apiKey) {
      fp.loadFilepicker().then(function() {
        return $window.filepicker.setKey(config.apiKey);
      });
    } else {
      fp.log("apiKey is required!", "error");
    }
    $rootScope.filepickerModalOpen = false;
    $rootScope.filepickerModalClose = function() {
      return fp.modalToggle(false);
    };
    $rootScope.$on('$routeChangeSuccess', function() {
      return fp.modalToggle(false);
    });
    return $rootScope.$on(fp.events.modal.close, function() {
      return fp.modalToggle(false);
    });
  }
]);

/**
* @ngdoc directive
* @name infowrapFilepicker.directive:filepickerBtn
* @description
*
* Directive to open the file picker modal.
*
* @element ATTRIBUTE
*/


infowrapFilepicker.directive("filepickerBtn", [
  "infowrapFilepicker.config", "infowrapFilepickerService", "infowrapFilepickerSecurity", "$timeout", "$rootScope", function(config, fp, fps, $timeout, $rootScope) {
    var link;
    link = function(scope, element, attrs) {
      var processFiles;
      if (!_.isUndefined(scope.processWhen) && !scope.processWhen) {
        element.remove();
        return;
      }
      processFiles = function(fpfiles) {
        var $previewTarget, dispatchPickedFiles, signOptions, targ;
        if (!_.isArray(fpfiles)) {
          fpfiles = [fpfiles];
        }
        fp.resetFileStatus();
        if (scope.previewOnUpload) {
          if (scope.previewTarget) {
            targ = element.closest(scope.previewTarget);
            $previewTarget = targ.length ? targ : element.siblings(scope.previewTarget);
            fp.dropDomId = $previewTarget.attr('id');
            fp.dropTargetType = $previewTarget.data('target-type');
          }
          fp.usedFilePickerDialog = true;
          if (!scope.preventDefault) {
            fp.addToFilesUploading(fpfiles);
            fp.readFiles(fpfiles);
          } else {
            dispatchPickedFiles = function(files) {
              return $rootScope.$broadcast(fp.events.pickedFiles, files, scope.targetType);
            };
            if (config.useSecurity) {
              signOptions = {
                wrapId: scope.targetParentId,
                signType: scope.signType,
                signTypeResourceId: scope.signTypeResourceId
              };
              fps.secureForReading(fpfiles, signOptions).then(dispatchPickedFiles);
            } else {
              dispatchPickedFiles(fpfiles);
            }
          }
        } else if (scope.storeLocation) {
          $rootScope.$broadcast(fp.events.store, {
            data: fpfiles,
            targetId: scope.targetId,
            targetParentId: scope.targetParentId,
            targetType: scope.targetType
          });
        }
        return $rootScope.safeApply();
      };
      return scope.pick = function(e) {
        var cachedPolicy, cachedPolicyOptions, showPickDialog, signOptions;
        showPickDialog = function(signedPolicy) {
          var options, pickedFiles;
          if (config.useSecurity) {
            options = {
              policy: signedPolicy.encoded_policy,
              signature: signedPolicy.signature,
              path: signedPolicy.policy.path
            };
          } else {
            options = {};
          }
          if (scope.mimeTypes) {
            _.extend(options, {
              mimetypes: scope.mimeTypes.split(',')
            });
          }
          if (scope.multiple === 'false') {
            _.extend(options, {
              multiple: false
            });
          }
          if (scope.maxSize) {
            _.extend(options, {
              maxSize: Number(scope.maxSize)
            });
          }
          if (scope.services) {
            _.extend(options, {
              services: scope.services.split(',')
            });
          }
          pickedFiles = function(fpfiles) {
            fp.log(fpfiles);
            return processFiles(_.isArray(fpfiles) ? fpfiles : [fpfiles]);
          };
          if (scope.storeLocation) {
            return fp.pickAndStore(options).then(pickedFiles);
          } else {
            return fp.pick(options).then(pickedFiles);
          }
        };
        if (config.useSecurity) {
          cachedPolicyOptions = {
            "new": true,
            signType: scope.signType
          };
          cachedPolicy = fps.getCachedPolicy(cachedPolicyOptions);
          if (cachedPolicy) {
            return showPickDialog(cachedPolicy);
          } else {
            signOptions = {
              "new": true,
              wrapId: scope.targetParentId,
              signType: scope.signType,
              signTypeResourceId: scope.signTypeResourceId
            };
            return fps.sign(signOptions).then(function(signedPolicy) {
              return showPickDialog(signedPolicy);
            });
          }
        } else {
          return showPickDialog();
        }
      };
    };
    return {
      restrict: "A",
      scope: {
        closeModalOnOpen: "@",
        btnClass: "@",
        dragAndDrop: "@",
        icon: "@",
        ignoreReadSigning: "@",
        mimeTypes: "@",
        maxSize: "@",
        multiple: "@",
        preventDefault: "@",
        previewOnUpload: "@",
        previewTarget: "@",
        processWhen: "=?",
        services: "@",
        signType: "@",
        signTypeResourceId: "@",
        storeLocation: "@",
        targetId: "=?",
        targetParentId: "=?",
        targetType: "@",
        text: "@"
      },
      replace: true,
      transclude: true,
      template: "<div data-ng-transclude></div>",
      link: link
    };
  }
]);
