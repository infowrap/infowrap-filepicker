angular.module("infowrapFilepicker.config", []).value("infowrapFilepicker.config", {})

###*
* @ngdoc module
* @name infowrapFilepicker
* @requires infowrapFilepicker.config
* @description
*
* The primary module which needs to be injected into your application to provide filepicker services and directives.
*
###

infowrapFilepicker = angular.module("infowrapFilepicker", ["infowrapFilepicker.config"])

infowrapFilepicker
  .config ['$provide', ($provide) ->
    $provide.decorator '$rootScope', ['$delegate', ($delegate) ->
      # everybody needs a safeApply :)
      $delegate.safeApply = (fn) ->
        phase = $delegate.$$phase
        if phase is "$apply" or phase is "$digest"
          if fn and typeof fn is 'function'
            # in middle of digest, just execute function normally
            fn()
        else
          $delegate.$apply(fn)
      return $delegate
    ]
  ]

###*
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
###

infowrapFilepicker.factory("infowrapFilepickerService", ["infowrapFilepicker.config", "infowrapFilepickerSecurity", "$log", "$window", "$q", "$rootScope", "$timeout", (config, fps, $log, $window, $q, $rootScope, $timeout) ->

  api = {}

  ###*
  * @doc method
  * @name infowrapFilepicker.service:infowrapFilepickerService#loadFilepicker
  * @methodOf infowrapFilepicker.service:infowrapFilepickerService
  * @description
  *
  * Loads the filepicker javascript library.
  *
  * @returns {object} promise - gets resolved when filepicker library is loaded
  *
  ###
  api.loadFilepicker = ->
    defer = $q.defer()
    # Configure a specific protocol to use or fallback to using whatever protocol this is being hosted from
    configuredProtocol = config.loadProtocol or ""
    $('body').append("<script type=\"text/javascript\" src=\"#{configuredProtocol}//api.filepicker.io/v1/filepicker.js\"></script>")
    checkIfLoaded = ->
      if _.isUndefined($window.filepicker)
        $timeout ->
          checkIfLoaded()
        , 50
      else
        defer.resolve()
    checkIfLoaded()
    defer.promise

  ###*
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
  ###
  api.log = (msg, type) ->
    if config.debugLogging
      if type
        $log[type](msg)
      else
        $log.log(msg)

  api.events = {}

  # standardize event names
  # uniquely identify event names with prefix
  eventPrefix = "infowrapFilepicker"

  # should match filepicker's api methods
  apiMethods = ["pick", "pickAndStore", "exportFile", "read", "stat", "write", "writeUrl", "store", "convert", "remove"]

  # helper events
  helperEvents = ["pickedFiles", "error", "readingFiles", "readingFilesComplete", "readVCard", "readProgress", "resetFilesUploading", "progress", "storeProgress", "writeUrlProgress", "uploadProgress", "uploadsComplete"]

  # combine api and helper events for processing
  allEvents = apiMethods.concat(helperEvents)

  # modal events
  modalEvents = ["close"]
  api.events.modal = {}
  _.forEach modalEvents, (event) ->
    api.events.modal[event] = "#{eventPrefix}:modal:" + event

  _.forEach allEvents, (event) ->
    api.events[event] = "#{eventPrefix}:" + event

    # build service interface
    if _.contains(apiMethods, event)
      # if valid api method, mock the implementation (full implementations added below)
      api[event] = ->
        api.log("#{event} needs implementation!", "error")


  # DEFAULT PICK OPTIONS
  defaultPickOptions =
    container: "modal" # default to modal
    maxSize: 5 * 1024 * 1024 # 5 MB

  pickOptions = _.extend(defaultPickOptions, config.pickOptions)

  preparePickOptions = (opt) ->
    opt = opt or {}
    # always default to multiple if unspecified
    # must check hasOwnProperty because we could be explicitly passing in false (bool)
    opt.multiple = if opt.hasOwnProperty('multiple') then opt.multiple else true
    # when using custom options, clone default pickOptions so they are not modified for later usage!
    options = _.clone(pickOptions, true)
    _.extend(options, opt) # merge custom options with defaults
    return options

  ###*
  * @doc method
  * @name infowrapFilepicker.service:infowrapFilepickerService#positionModal
  * @methodOf infowrapFilepicker.service:infowrapFilepickerService
  * @description
  *
  * When using iframe container, this will center the modal on screen.
  *
  ###
  api.positionModal = () ->
    # only used when FilePickerIO.config provides a value for 'iframeContainer'
    if config.iframeContainer
      $iframeContainer = $("##{config.iframeContainer}")
      $win = angular.element($window)
      h = $win.outerHeight(true)
      if config.isMobile
        # fill entire viewport on mobile
        top = left = 0
        width = '100%'
        height = "#{h + 60}px" # add address bar
      else
        w = $win.outerWidth(true)
        width = "#{w}px"
        height = "#{h}px"
        top = 50
        left = w/2 - $iframeContainer.width()/2
        if left < 0
          # if negative, make flush left
          left = 0
      positionSettings =
        top:"#{top}px"
        left:"#{left}px"
      _.extend(positionSettings, {width:width, height:height}) if config.isMobile
      $iframeContainer.css(positionSettings)

  ###*
  * @doc method
  * @name infowrapFilepicker.service:infowrapFilepickerService#modalToggle
  * @methodOf infowrapFilepicker.service:infowrapFilepickerService
  * @description
  *
  * Toggle on/off the picker modal.
  *
  * This also sets up ESC key listener to close the modal as well as window resize to reposition modal.
  *
  ###
  api.modalToggle = (force) ->
    enabled = if _.isUndefined(force) then not $rootScope.filepickerModalOpen else force
    $rootScope.filepickerModalOpen = enabled
    $rootScope.safeApply()

    handleEscapeKey = (e) ->
      if e.which is 27
        e.preventDefault()
        if $rootScope.filepickerModalOpen
          # toggle modal off when hitting ESC, only if it's actually open
          $rootScope.safeApply ->
            api.modalToggle(false)

    handleModalPosition = (e) ->
      if $rootScope.filepickerModalOpen
        api.positionModal()

    $body = angular.element('body')
    $win = angular.element($window)
    if enabled
      $body.bind('keydown', handleEscapeKey)
      $win.bind('resize', handleModalPosition)
      $timeout ->
        # always ensure window is scrolled to top when this modal appears
        $win.scrollTop(0)
      , if config.isMobile then 300 else 0
    else
      $body.unbind('keydown', handleEscapeKey)
      $win.unbind('resize', handleModalPosition)



  ###*
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
  ###
  api.pick = (opt) ->
    defer = $q.defer()
    opt = preparePickOptions(opt)
    api.log(opt)

    # show modal
    api.modalToggle(true)

    onSuccess = (fpfiles) ->
      $rootScope.safeApply ->
        api.modalToggle(false)
        defer.resolve(fpfiles)

    onError = (fperror) ->
      api.log(fperror)
      $rootScope.safeApply ->
        api.modalToggle(false)
        defer.reject(fperror)

    if opt.multiple
      filepicker.pickMultiple(opt, onSuccess, onError)
    else
      filepicker.pick(opt, onSuccess, onError)

    # post evaluate modal positioning
    $timeout ->
      # important that this is evaluated after angular has digested everything
      api.positionModal()
    , 0

    defer.promise

  ###*
  * @doc method
  * @name infowrapFilepicker.service:infowrapFilepickerService#pickAndStore
  * @methodOf infowrapFilepicker.service:infowrapFilepickerService
  * @description
  *
  * Filepicker's `pickAndStore`.
  *
  * @param {object} options - see filepicker docs [here](https://developers.inkfilepicker.com/docs/web/#pickAndStore) to learn more.
  ###
  api.pickAndStore = (opt) ->
    defer = $q.defer()
    opt = preparePickOptions(opt)
    api.log(opt)

    # show modal
    api.modalToggle(true)

    onSuccess = (fpfiles) ->
      $rootScope.safeApply ->
        api.modalToggle(false)
        defer.resolve(fpfiles)

    onError = (fperror) ->
      api.log(fperror)
      $rootScope.safeApply ->
        api.modalToggle(false)
        defer.reject(fperror)

    storeOptions =
      location:'S3'
      path:opt.path

    filepicker.pickAndStore(opt, storeOptions, onSuccess, onError)

    # post evaluate modal positioning
    $timeout ->
      # important that this is evaluated after angular has digested everything
      api.positionModal()
    , 0

    defer.promise

  ###*
  * @doc method
  * @name infowrapFilepicker.service:infowrapFilepickerService#writeUrl
  * @methodOf infowrapFilepicker.service:infowrapFilepickerService
  * @description
  *
  * Filepicker's `writeUrl`.
  *
  * @param {object} options - see filepicker docs [here](https://developers.inkfilepicker.com/docs/web/#writeUrl) to learn more.
  ###
  api.writeUrl = (targetFpFile, url, opt) ->
    defer = $q.defer()
    opt = opt or {}
    cleanUrl = _.first(url.split('?'))
    api.log(cleanUrl)

    filepicker.writeUrl targetFpFile, cleanUrl, opt, (fpfile) ->
      $rootScope.safeApply ->
        defer.resolve(fpfile)

    , (fperror) ->
      api.log(fperror)
      $rootScope.safeApply ->
        defer.reject(fperror)

    defer.promise


  ###*
  * @doc method
  * @name infowrapFilepicker.service:infowrapFilepickerService#store
  * @methodOf infowrapFilepicker.service:infowrapFilepickerService
  * @description
  *
  * Filepicker's `store`.
  *
  * @param {object} options - see filepicker docs [here](https://developers.inkfilepicker.com/docs/web/#store) to learn more.
  ###
  api.store = (input, opt) ->
    defer = $q.defer()

    storeFile = (signedPolicy) ->
      result = input: input

      # assign signed policy first
      options =
        policy: signedPolicy.encoded_policy
        signature: signedPolicy.signature
        path: signedPolicy.policy.path
        location:'S3'

      filepicker.store input, options, (data) ->
        _.extend(result, data: data)
        $rootScope.safeApply ->
          defer.resolve(result)

      , (fperror) ->
        api.log(fperror)
        _.extend(result, error: fperror)
        $rootScope.safeApply ->
          defer.reject(result)

      # commenting out progress events due to filepicker bug
      # , (percent) ->
      #   _.extend(result, progress: percent)
      #   $rootScope.safeApply ->
      #     $rootScope.$broadcast(api.events.storeProgress, result)

    # check if a cached policy already exist for this
    cachedPolicy = fps.getCachedPolicy({new:true})
    if cachedPolicy
      storeFile(cachedPolicy)
    else
      # no cached policy, sign to get one
      signOptions =
        new:true

      if opt.wrapId
        signOptions.wrapId = opt.wrapId
      else if opt.signType
        signOptions.signType = opt.signType

      fps.sign(signOptions).then (signedPolicy) ->
        storeFile(signedPolicy)

    defer.promise

  ###*
  * @doc method
  * @name infowrapFilepicker.service:infowrapFilepickerService#export
  * @methodOf infowrapFilepicker.service:infowrapFilepickerService
  * @description
  *
  * Filepicker's `export`.
  *
  * @param {object} options - see filepicker docs [here](https://developers.inkfilepicker.com/docs/web/#export) to learn more.
  ###
  api.export = (input, opt, success, failure) ->
    defer = $q.defer()
    opt = opt or {}

    fps.sign({id:input.id, new:true}).then () ->
      newPolicy = fps.cachedPolicies.new
      options =
        policy: newPolicy.encoded_policy
        signature: newPolicy.signature
      opt = _.extend opt, options
      # fps.secureForReading([input], {id:true}).then (result) ->
      #   api.log(result)
      filepicker.exportFile input.url.url, opt, (data) ->
        $rootScope.safeApply ->
          defer.resolve(data)

      , (fperror) ->
        api.log(fperror)
        $rootScope.safeApply ->
          defer.reject(fperror)

    defer.promise

  ###*
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
  ###
  api.read = (input, opt) ->
    defer = $q.defer()
    opt = opt or {base64encode: true}
    usingImage = opt.base64encode

    readFile = (url) ->
      api.log("filepicker.read: #{url}")
      existingPolicy = fps.cachedPolicies.existing
      _.extend opt,
        policy: existingPolicy.encoded_policy
        signature: existingPolicy.signature

      result = input: input
      filepicker.read url, opt, (data) ->
        data = "data:image/png;base64,#{data}" if usingImage
        _.extend(result, data: data)
        $rootScope.safeApply ->
          defer.resolve(result)
          $rootScope.$broadcast(api.events.read, result)
      , (fperror) ->
        api.log(fperror)
        _.extend(result, error: fperror)
        $rootScope.safeApply ->
          defer.reject(result)
      # commenting out progress events due to filepicker bug
      # , (percent) ->
      #   _.extend(result, progress: percent)
      #   $rootScope.safeApply ->
      #     $rootScope.$broadcast(api.events.readProgress, result)

    getUrlToReadFrom = (input, options) ->
      url = input
      if _.isObject(input)
        # only specify file_id if a valid id (as a number) is present on the input
        _.extend(options, {id:input.id}) if options and _.isNumber(input.id)

        if _.isObject(input.url)
          # bizbuilt.com api wraps filepicker in a hash {exp:'expiry',url:'fp_url'}
          url = input.url.url
        else
          url = input.url

      # only specify handle as an option when no policy/signature are found on the url (meaning haven't been saved)
      # handle is used to generate clientside previews for files that have not been stored yet
      _.extend(options, {handle:url}) if options and url.indexOf('policy') is -1
      url

    # must always sign when reading files as the handle is critical to match the encoded policy
    signOptions = {}

    url = getUrlToReadFrom(input, signOptions)

    fps.sign(signOptions).then ->
      readFile(url)

    defer.promise

  ###
  END filepicker api implementations
  ###

  ###
  Helper functions and sweeteners
  ###

  api.previewTargetLoad = () ->
    if api.dropDomId
      $el = $("##{api.dropDomId}")
      $el.addClass('loading-image')

  api.previewTargetReady = (result, ignoreImgLoad) ->
    $el = $("##{api.dropDomId}")
    fieldName = $el.data('field-name')

    cleanSrc = undefined
    cleanSrc = result.data.replace(/\n/g, "")

    unless ignoreImgLoad
      targetImage = document.createElement("image")
      targetImage.onload = ->
        #$el.css "background-image": "none"
        $timeout(->
          $el.removeClass('loading-image') #.addClass('preview-loaded')
          $el.css
            "background-image": "url(" + cleanSrc + ")"
        , 100)
        targetImage.src = ""

      targetImage.src = cleanSrc

    target =
      fieldName: fieldName
      data: _.extend(result.input, {id:_.uniqueId()})
    target


  # vCard
  api.readVCardData = (input) ->
    defer = $q.defer()

    if input
      api.read(input, asText:true).then (readResult) ->
        result =
          data: vCard.initialize(readResult.data)
          input: readResult.input
        defer.resolve(result)
        $rootScope.$broadcast api.events.readVCard, result

    defer.promise


  api.readFiles = (files, dropZone, preventDefault) ->
    $rootScope.$broadcast api.events.readingFiles unless preventDefault

    unless api.dropTargetField
      # when dropTargetField is defined, we want to ignore reading files altogether
      # dropTargetField will cause an immediate resource update and therefore not require further user action or preview

      if dropZone
        api.log("--------\nDropped on specific zone target!")
        api.log(dropZone)
        api.log("for: " + dropZone.data("for"))
      else
        cnt = 0

        continueReading = () ->
          cnt++
          if cnt < files.length
            # read next file
            readFile()
          else
            $rootScope.$broadcast api.events.readingFilesComplete
            $rootScope.safeApply()

        readFile = () ->
          file = files[cnt]
          fileName = file.name or file.filename
          if file.type isnt 'file_asset'
            fileType = file.type or file.mimetype or file.mime_type
          else
            fileType = file.mime_type
          result = input: file

          api.log("---------\nReading file:")
          api.log(fileName + " (#{fileType})")

          fileType = "image"  if fileType.search(/image\/(gif|jpeg|png|tiff)/) > -1
          switch fileType
            when "text/directory"
              api.readVCardData(file).then ->
                continueReading()
            when "image"
              api.read(file).then ->
                continueReading()
            when "text/plain"
              continueReading()
              $rootScope.$broadcast api.events.read, _.extend(result)
            when "application/pdf"
              continueReading()
              $rootScope.$broadcast api.events.read, _.extend(result)

        # start reading
        readFile()

    # this safeApply is CRITICAL! do not remove! ... or be a lost soul on a lonely island!
    $rootScope.safeApply()


  api.addToFilesUploading = (files) ->
    api.filesUploading = api.filesUploading.concat(_.flatten(files))
    _.forEach api.filesUploading, (file) ->
      # provide unique id's for view handling
      file.id = _.uniqueId((file.name or file.filename))


  # upload progress
  api.setUploadProgress = (data) ->
    percent = Math.floor(data)
    api.log("Uploading (" + percent + "%)")
    api.uploadProgress = percent
    api.uploadProgressStyle = width: percent + "%"
    if percent > 25
      $timeout (->
        $fileStatus = $(".file-status")
        totalWidth = $fileStatus.find(".upload-percentage").width()
        rightOffset = totalWidth - Math.floor(totalWidth * (percent * .01))
        $fileStatus.find(".upload-percent-text").css right: (rightOffset + 12) + "px"
      ), 200

  api.uploadProgressClasses = ->
    (if api.filesUploading.length then "progress-striped active" else "progress-info")

  api.addToFilesUploaded = (files) ->
    # You could potentially persist filesUploaded to localStorage here
    api.filesUploaded = api.filesUploaded.concat(_.flatten(files))
    _.forEach api.filesUploaded, (file) ->
      unless file.hasOwnProperty('created_at')
        file.created_at = JSON.parse(JSON.stringify(new Date()))
    # when adding to filesUploaded, always clear filesUploading
    api.filesUploading = []
    $rootScope.uploadsInProgress = false

  api.clearFilesUploaded = ->
    api.filesUploaded = []

  api.resetFileStatus = ->
    $rootScope.uploadsInProgress = false
    api.usedFilePickerDialog = false
    api.dropDomId = undefined
    api.dropTargetId = undefined
    api.dropTargetParentId = undefined
    api.dropTargetType = undefined
    api.dropTargetField = undefined
    api.dropWindow = undefined
    api.uploadProgress = 0
    api.uploadProgressStyle =
      width: "0px"
    api.filesUploading = api.filesUploaded = []

  api.resetFileStatus() # call reset status to initialize properties

  api

])

###*
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
###

infowrapFilepicker.factory("infowrapFilepickerSecurity", ["infowrapFilepicker.config", "$log", "$q", "$rootScope", "$http", (config, $log, $q, $rootScope, $http) ->
  # security for filepicker

  signingInProcess = false # helps avoid multiple signing calls at once
  getOperations = (isNew) ->
    if isNew then api.operations.new else api.operations.existing

  api = {}

  # useful to cache policies in case the same operation is being used in farely rapid succession
  api.cachedPolicies =
    new:{}
    existing:{}
    # types: this is for specific types of signing which may use a special sign api call than the default
    types:{}

  # due to their nature, best to have filepicker's api split out into 2 different sets of operations
  # this makes signing simpler for various purposes
  api.operations =
    new:['pick', 'store', 'storeUrl'] # for creation of 'new' filepicker files
    existing: ['read', 'stat', 'convert', 'write', 'writeUrl'] # for working with 'existing' filepicker files

  # use this to check if a valid cached policy exists for the set of operations needed
  api.getCachedPolicy = (opt) ->
    opt = opt or {}
    # opt:
    #     new(bool) - flag to check the appropriate cached policy for the particular set of operations
    #
    # ...more options may be required in the future
    if _.isUndefined(opt.signType)
      cachedPolicy = api.cachedPolicies[if opt.new then 'new' else 'existing']
    else
      cachedPolicy = api.cachedPolicies.types[opt.signType]
      if cachedPolicy
        cachedPolicy = api.cachedPolicies.types[opt.signType][if opt.new then 'new' else 'existing']


    if cachedPolicy and cachedPolicy.policy
      operations = getOperations(opt.new)
      # check if operation requested already has a valid policy cached
      isCached = _.find cachedPolicy.policy.call, (operation) ->
        _.contains(operations, operation)
      if isCached and cachedPolicy.policy.expiry
        # check the expiration
        rightNowEpoch = Math.floor(new Date().getTime() / 1000)
        if rightNowEpoch <= Number(cachedPolicy.policy.expiry)
          return cachedPolicy

    return false


  api.sign = (opt) ->
    opt = opt or {}
    # opt: new(bool), id(int), size(int)
    defer = $q.defer()
    signage =
      options:
        call:getOperations(opt.new)
    _.extend(signage.options, {file_id:opt.id}) if opt.id
    # handle is primarily for reading files that have not been stored yet
    # must strip the filepicker id off the end of the handle
    _.extend(signage.options, {handle:opt.handle.substr(opt.handle.lastIndexOf('/') + 1)}) if opt.handle
    _.extend(signage.options, {file_size:opt.size}) if opt.size

    # Infowrap specific
    # default to wrap
    activeWrapId = if $rootScope.activeWrap then $rootScope.activeWrap.id else undefined
    opt.resourceId = opt.wrapId or activeWrapId
    if opt.signType is 'account'
      # override resourceId for specific types
      opt.resourceId = opt.signTypeResourceId or $rootScope.currentUser.id

    unless signingInProcess
      # prevent multiple simultaneous signing calls (can happen on page load)
      signingInProcess = true
      $http.post(config.signApiUrl(opt.resourceId, opt.signType), signage).success((result) ->
        signingInProcess = false
        # cache the policy for the appropriate operation sets
        if config.debugLogging
          $log.log("--- filepicker security sign ---")
          $log.log(signage.options.call)

        updateSignTypePolicy = () ->
          cachedType = api.cachedPolicies.types[opt.signType]
          if _.isUndefined(cachedType)
            api.cachedPolicies.types[opt.signType] = {}

          api.cachedPolicies.types[opt.signType][if opt.new then 'new' else 'existing'] = result

        getSignedPolicy = () ->
          if opt.new
            if _.isUndefined(opt.signType)
              api.cachedPolicies.new = result
            else
              updateSignTypePolicy()
          else
            if _.isUndefined(opt.signType)
              api.cachedPolicies.existing = result
            else
              updateSignTypePolicy()

        defer.resolve(getSignedPolicy())
        ).error (result) ->
          signingInProcess = false
          # TODO: should probably handle these errors in a standard way
          if result.error is 'filenotfound'
            if config.debugLogging
              $log.log(result.error)

          defer.reject(result.error)

    # safe apply is critical here - sometimes a sign() call will be made outside of angular's digest
    # without this, the $http call above will sometimes not fire! - do not remove
    $rootScope.safeApply()

    defer.promise

  api.secureForReading = (fpfiles, options) ->
    defer = $q.defer()
    fileCnt = 0

    signFile = () ->
      file = fpfiles[fileCnt]

      signOptions = {}
      if options and options.id
        signOptions.id = file.id
      else
        # defaults to using url as handle
        signOptions.handle = if _.isObject(file.url) then file.url.url else file.url

      signOptions.signType = options.signType if options.signType
      signOptions.signTypeResourceId = options.signTypeResourceId if options.signTypeResourceId

      api.sign(signOptions).then ->
        if _.isUndefined(signOptions.signType)
          existingPolicy = api.cachedPolicies.existing
        else
          existingPolicy = api.cachedPolicies.types[signOptions.signType].existing
        # update url to have a secure policy
        appendedSecurity = "?signature=#{existingPolicy.signature}&policy=#{existingPolicy.encoded_policy}"
        if _.isObject(file.url)
          # our wrapped file_assets
          file.url.url += appendedSecurity
        else
          # filepicker file
          file.url += appendedSecurity

        fileCnt++
        if fileCnt is fpfiles.length
          defer.resolve(fpfiles)
        else
          signFile()

    signFile()

    defer.promise

  api
])

infowrapFilepicker.run(["infowrapFilepicker.config", 'infowrapFilepickerService', '$rootScope', '$window', (config, fp, $rootScope, $window) ->

  if config.apiKey
    fp.loadFilepicker().then ->
      $window.filepicker.setKey(config.apiKey)
  else
    fp.log("apiKey is required!", "error")

  $rootScope.filepickerModalOpen = false

  $rootScope.filepickerModalClose = () ->
    fp.modalToggle(false)

  $rootScope.$on '$routeChangeSuccess', () ->
    # always reset on route change
    fp.modalToggle(false)

  $rootScope.$on fp.events.modal.close, () ->
    # backdrop click - close filepicker modal
    fp.modalToggle(false)
])

###*
* @ngdoc directive
* @name infowrapFilepicker.directive:filepickerBtn
* @description
*
* Directive to open the file picker modal.
*
* @element ATTRIBUTE
###

infowrapFilepicker.directive("filepickerBtn", ["infowrapFilepicker.config", "infowrapFilepickerService", "infowrapFilepickerSecurity", "$timeout", "$rootScope", (config, fp, fps, $timeout, $rootScope) ->
  link = (scope, element, attrs) ->

    if !_.isUndefined(scope.processWhen) and !scope.processWhen
      element.remove()
      return

    processFiles = (fpfiles) ->
      unless _.isArray(fpfiles)
        # because pick is sometimes used (for single file select) over pickMultiple
        # always ensure fpfiles is an array
        fpfiles = [fpfiles]

      fp.resetFileStatus()
      if scope.previewOnUpload
        if scope.previewTarget
          targ = element.closest(scope.previewTarget)
          $previewTarget = if targ.length then targ else element.siblings(scope.previewTarget)
          fp.dropDomId = $previewTarget.attr('id')
          fp.dropTargetType = $previewTarget.data('target-type')

        fp.usedFilePickerDialog = true
        unless scope.preventDefault
          fp.addToFilesUploading(fpfiles)
          fp.readFiles(fpfiles)
        else
          dispatchPickedFiles = (files) ->
            $rootScope.$broadcast(fp.events.pickedFiles, files, scope.targetType)

          if config.useSecurity
            # security is enabled by default
            # must handle security for these picked files (because we cannot read a file that is not secured)
            signOptions =
              wrapId:scope.targetParentId
              signType:scope.signType
              signTypeResourceId:scope.signTypeResourceId
            fps.secureForReading(fpfiles, signOptions).then(dispatchPickedFiles)
          else
            dispatchPickedFiles(fpfiles)


      else if scope.storeLocation
        $rootScope.$broadcast fp.events.store,
          data: fpfiles
          targetId: scope.targetId
          targetParentId: scope.targetParentId
          targetType: scope.targetType
      $rootScope.safeApply()

    scope.pick = (e) ->

      showPickDialog = (signedPolicy) ->

        if config.useSecurity
          # assign signed policy first
          options =
            policy: signedPolicy.encoded_policy
            signature: signedPolicy.signature
            path:signedPolicy.policy.path
        else
          options = {}

        # handle options passed in via the directive
        _.extend(options, {mimetypes: scope.mimeTypes.split(',')}) if scope.mimeTypes
        _.extend(options, {multiple: false}) if scope.multiple is 'false' # explicitly set to false
        _.extend(options, {maxSize: Number(scope.maxSize)}) if scope.maxSize
        _.extend(options, {services: scope.services.split(',')}) if scope.services

        # cause the filepicker modal to appear
        pickedFiles = (fpfiles) ->
          fp.log(fpfiles)
          processFiles(if _.isArray(fpfiles) then fpfiles else [fpfiles])


        if scope.storeLocation
          # go ahead and store immediately after the pick
          fp.pickAndStore(options).then(pickedFiles)
        else
          fp.pick(options).then(pickedFiles)

      if config.useSecurity
        # check if a cached policy already exist for this
        cachedPolicyOptions =
          new:true
          signType:scope.signType
        cachedPolicy = fps.getCachedPolicy(cachedPolicyOptions)
        if cachedPolicy
          showPickDialog(cachedPolicy)
        else
          # no cached policy, sign to get one
          signOptions =
            new:true
            wrapId:scope.targetParentId
            signType:scope.signType
            signTypeResourceId:scope.signTypeResourceId
          fps.sign(signOptions).then (signedPolicy) ->
            showPickDialog(signedPolicy)
      else
        showPickDialog()

  restrict: "A"
  scope:
    closeModalOnOpen:"@"
    btnClass:"@"
    dragAndDrop: "@"
    icon: "@"
    ignoreReadSigning: "@"
    mimeTypes: "@"
    maxSize: "@"
    multiple: "@"
    preventDefault:"@"
    previewOnUpload: "@"
    previewTarget:"@"
    processWhen: "=?"
    services: "@"
    signType: "@"
    signTypeResourceId: "@"
    storeLocation: "@"
    targetId: "=?"
    targetParentId:"=?"
    targetType: "@"
    text: "@"

  replace: true
  transclude:true
  template: "<div data-ng-transclude></div>"
  link: link

])
