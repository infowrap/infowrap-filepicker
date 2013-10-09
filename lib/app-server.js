/**
 * USED WITH GRUNT for development! - Usage: grunt run
 */

/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./preview-server'),
  childProcess = require('child_process'),
  path = require('path');

var app = module.exports = express();

// Configuration

app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, '../examples'));
app.set('view engine', 'html');

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, '../examples')));
});

app.configure('development', function(){
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.set('view options', {
    pretty:true
  });
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// redirect all to the index (HTML5 history)
app.get('*', routes.index);
