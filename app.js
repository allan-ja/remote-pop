var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');

var index = require('./routes/index');
var movie = require('./routes/movie');
var users = require('./routes/users');

var app = express();

// view engine setup
app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', 'hbs');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/movies', express.static(path.join(__dirname, 'public')));
app.use('/movie', express.static(path.join(__dirname, 'public')));


app.use('/', index);
//app.use('/movies', index);
app.use('/movie', movie);
app.use('/users', users);

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
