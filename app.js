var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var message = require('./routes/message');
var users = require('./routes/users');
var customerService = require('./routes/customerService');
var system = require('./routes/system');
var sms = require('./routes/sms');
var backgroudSetting = require('./routes/backgroudSetting');

var util = require('./util/util');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/message', message);
app.use('/users', users);
app.use('/system', system);
app.use('/customerService', customerService);
app.use('/sms', sms);
app.use('/backgroudSetting', backgroudSetting);

util.deleteUserTask();
util.updateDataFromRedisToSqlTask();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
