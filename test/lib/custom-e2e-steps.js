/**
 * Usage:
 *    element(selector, label).count() get the number of elements that match selector
 *    element(selector, label).click() clicks an element
 *    element(selector, label).mouseover() mouseover an element
 *    element(selector, label).query(fn) executes fn(selectedElements, done)
 *    element(selector, label).{method}() gets the value (as defined by jQuery, ex. val)
 *    element(selector, label).{method}(value) sets the value (as defined by jQuery, ex. val)
 *    element(selector, label).{method}(key) gets the value (as defined by jQuery, ex. attr)
 *    element(selector, label).{method}(key, value) sets the value (as defined by jQuery, ex. attr)
 */
angular.scenario.dsl('element', function() {
  var KEY_VALUE_METHODS = ['attr', 'css', 'prop'];
  var VALUE_METHODS = [
    'val', 'text', 'html', 'height', 'innerHeight', 'outerHeight', 'width',
    'innerWidth', 'outerWidth', 'position', 'scrollLeft', 'scrollTop', 'offset'
  ];
  var chain = {};

  chain.count = function() {
    return this.addFutureAction("element '" + this.label + "' count", function($window, $document, done) {
      try {
        done(null, $document.elements().length);
      } catch (e) {
        done(null, 0);
      }
    });
  };

  chain.click = function() {
    return this.addFutureAction("element '" + this.label + "' click", function($window, $document, done) {
      var elements = $document.elements();
      var href = elements.attr('href');
      var eventProcessDefault = elements.trigger('click')[0];

      if (href && elements[0].nodeName.toUpperCase() === 'A' && eventProcessDefault) {
        this.application.navigateTo(href, function() {
          done();
        }, done);
      } else {
        done();
      }
    });
  };

  chain.dblclick = function() {
    return this.addFutureAction("element '" + this.label + "' dblclick", function($window, $document, done) {
      var elements = $document.elements();
      var href = elements.attr('href');
      var eventProcessDefault = elements.trigger('dblclick')[0];

      if (href && elements[0].nodeName.toUpperCase() === 'A' && eventProcessDefault) {
        this.application.navigateTo(href, function() {
          done();
        }, done);
      } else {
        done();
      }
    });
  };

  chain.mouseover = function() {
    return this.addFutureAction("element '" + this.label + "' mouseover", function($window, $document, done) {
      var elements = $document.elements();
      elements.trigger('mouseover');
      done();
    });
  };

  chain.query = function(fn) {
    return this.addFutureAction('element ' + this.label + ' custom query', function($window, $document, done) {
      fn.call(this, $document.elements(), done);
    });
  };

  angular.forEach(KEY_VALUE_METHODS, function(methodName) {
    chain[methodName] = function(name, value) {
      var args = arguments,
          futureName = (args.length == 1)
              ? "element '" + this.label + "' get " + methodName + " '" + name + "'"
              : "element '" + this.label + "' set " + methodName + " '" + name + "' to " + "'" + value + "'";

      return this.addFutureAction(futureName, function($window, $document, done) {
        var element = $document.elements();
        done(null, element[methodName].apply(element, args));
      });
    };
  });

  angular.forEach(VALUE_METHODS, function(methodName) {
    chain[methodName] = function(value) {
      var args = arguments,
          futureName = (args.length == 0)
              ? "element '" + this.label + "' " + methodName
              : futureName = "element '" + this.label + "' set " + methodName + " to '" + value + "'";

      return this.addFutureAction(futureName, function($window, $document, done) {
        var element = $document.elements();
        done(null, element[methodName].apply(element, args));
      });
    };
  });

  return function(selector, label) {
    this.dsl.using(selector, label);
    return chain;
  };
});

angular.scenario.dsl('input', function() {
  var chain = {};
  var supportInputEvent =  'oninput' in document.createElement('div');

  chain.enter = function(value, event) {
    return this.addFutureAction("input '" + this.name + "' enter '" + value + "'", function($window, $document, done) {
      var input = $document.elements('[data-ng-model="$1"]', this.name).filter(':input');
      input.val(value);
      input.trigger(event || (supportInputEvent ? 'input' : 'change'));
      done();
    });
  };


  chain.check = function() {
    return this.addFutureAction("checkbox '" + this.name + "' toggle", function($window, $document, done) {
      var input = $document.elements('[data-ng-model="$1"]', this.name).filter(':checkbox');
      input.trigger('click');
      done();
    });
  };

  chain.select = function(value) {
    return this.addFutureAction("radio button '" + this.name + "' toggle '" + value + "'", function($window, $document, done) {
      var input = $document.elements('[data-ng-model="$1"][value="$2"]', this.name, value).filter(':radio');
      input.trigger('click');
      done();
    });
  };

  chain.val = function() {
    return this.addFutureAction("return input val", function($window, $document, done) {
      var input = $document.elements('[data-ng-model="$1"]', this.name).filter(':input');
      done(null,input.val());
    });
  };

  return function(name) {
    this.name = name;
    return chain;
  };
});


angular.scenario.dsl('binding', function() {
  return function(name) {
    return this.addFutureAction("select binding '" + name + "'", function($window, $document, done) {
      var values = $document.elements().bindings($window.angular.element, name);
      if (!values.length) {
        return done("Binding selector '" + name + "' did not match.");
      }
      done(null, values[0]);
    });
  };
});


angular.scenario.dsl('alert', function() {

  var chain = {};

  chain.msgs = function(index){
    return this.addFutureAction('alert msgs', function($window, $document, done){
      var msgs = $window.parent.MOCK.alert.msgs;
      if(typeof index !== 'undefined'){
        msgs = msgs[index];
      }
      done(null, msgs);
    });
  };

  chain.reset = function(){
    return this.addFutureAction('reset alert msgs', function($window, $document, done){
      $window.parent.MOCK_RESET();
      done(null, true);
    });
  };
  chain.ok = function(){
    return this.addFutureAction('press OK on alert', function($window, $document, done){
        $window.parent.MOCK.confirm.ok = true;
        done(null, true);
      });
    };
  

  return function() {
    return chain;
  };
});

angular.scenario.dsl('confirm', function() {

  var chain = {};

  chain.msgs = function(index){
    return this.addFutureAction('confirm msgs', function($window, $document, done){
      var msgs = $window.parent.MOCK.confirm.msgs;
      if(typeof index !== 'undefined'){
        msgs = msgs[index];
      }
      done(null, msgs);
    });
  };
  chain.reset = function(){
    return this.addFutureAction('reset mock msgs', function($window, $document, done){
      $window.parent.MOCK_RESET();
      done(null, true);
    });
  };
  chain.ok = function(){
    return this.addFutureAction('press OK on confirm', function($window, $document, done){
      $window.parent.MOCK.confirm.ok = true;
      done(null, true);
    });
  };
  chain.cancel = function(){
    return this.addFutureAction('press CANCEL on confirm', function($window, $document, done){
      $window.parent.MOCK.confirm.ok = false;
      done(null, true);
    });
  };

  return function() {
    return chain;
  };
});

angular.scenario.dsl('history', function() {

  var chain = {};

  chain.back = function(numberOfTimes){
    return this.addFutureAction('use window.history.back', function($window, $document, done){
      if(typeof numberOfTimes === 'undefined') numberOfTimes = 1; // default
      for(var i =0; i < numberOfTimes; i++){
        $window.history.back();
      }

      done(null, true);
    });
  };

  return function() {
    return chain;
  };
});

/**
 * Usage:
 *    select(name).option('value') select one option
 *    select(name).options('value1', 'value2', ...) select options from a multi select
 */
angular.scenario.dsl('select', function() {
  var chain = {};

  chain.option = function(value) {
    return this.addFutureAction("select '" + this.name + "' option '" + value + "'", function($window, $document, done) {
      var select = $document.elements('select[data-ng-model="$1"]', this.name);
      var option = select.find('option[value="' + value + '"]');
      if (option.length) {
        select.val(value);
      } else {
        option = select.find('option:contains("' + value + '")');
        if (option.length) {
          select.val(option.val());
        } else {
          return done("option '" + value + "' not found");
        }
      }
      select.trigger('change');
      done();
    });
  };

  chain.options = function() {
    var values = arguments;
    return this.addFutureAction("select '" + this.name + "' options '" + values + "'", function($window, $document, done) {
      var select = $document.elements('select[multiple][data-ng-model="$1"]', this.name);
      select.val(values);
      select.trigger('change');
      done();
    });
  };

  return function(name) {
    this.name = name;
    return chain;
  };
});