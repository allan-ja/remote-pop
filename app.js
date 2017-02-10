var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var request = require("request");


var app = express();

// view engine setup
app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', 'hbs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/movies', express.static(path.join(__dirname, 'public')));
app.use('/movie', express.static(path.join(__dirname, 'public')));

/* Configure Router in spearates files
var index = require('./routes/index');
var movie = require('./routes/movie');
var users = require('./routes/users');

app.use('/', index);
//app.use('/movies', index);
app.use('/movie', movie);
//app.use('/users', users); */

/*** Router configuration */
var router = express.Router();

router.use(function (req,res,next) {
  console.log("/" + req.method);
  next();
});

router.get("/", function(req,res) {
  res.redirect('/movies/1')
});

router.get("/movies", function(req,res) {
  res.redirect('/movies/1')
});

router.get('/movies/:id', function(req, res, next) {
  console.log(req.params);
  var id = req.params !== '' ? req.params.id : 1;
  request('https://tv-v2.api-fetch.website/movies/' + id, function (err, response, body) {
      if(err) {
        console.log("err: " + err);
      } else {
        var movies = new Object();
        if (body != '') {
          console.log(body);
          movies["movie"] = JSON.parse(body);
          //console.log("json parsed, title: " + movies);
          res.render("index", movies);
        }
      }
  });
});

router.get('/movie/:id', function(req, res, next) {
  request('https://tv-v2.api-fetch.website/movie/' + req.params.id, function (err, response, body) {
      if(err) {
        console.log("err: " + err);
      } else {
        if (body != '') {
          var movie = JSON.parse(body);
          //console.log("json parsed, title: " + movies);
          res.render("movie", movie);
        }
      }
  });
});

router.post('/download', function(req, res) {
  console.log("Downloads id: " + req.body.id)
  res.send("tagId is set to " + req.query.tagId);
})

/*** END Router ***/

app.use("/",router);
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
