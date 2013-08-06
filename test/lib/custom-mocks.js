var MOCK;

var MOCK_RESET = function(){
  MOCK = {
    alert:{
      msgs:[]
    },
    confirm:{
      msgs:[],
      ok:true
    }
  };
};

var MOCK_INIT = function(AppModule){

  AppModule.run(['LogService', '$window', '$rootScope', function(log, $window, $rootScope){

    ($window.mockWindow || $window).alert = function(msg){
      log('Mock Alert: ' + msg);
      MOCK.alert.msgs.push(msg);
      return false;
    };

    ($window.mockWindow || $window).confirm = function(msg){
      log('Mock Confirm: ' + msg);
      MOCK.confirm.msgs.push(msg);
      return MOCK.confirm.ok;
    };
  }]);
};

MOCK_RESET(); // initialize mock configuration

