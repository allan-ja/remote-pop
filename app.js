var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var request = require("request");
var MongoClient = require('mongodb').MongoClient
var logger = require('morgan');
var assert = require('assert')

/* Package for login */
const passport = require('passport');
const mongoose = require('mongoose');
const Account = require('./models/account');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');



var app = express();

// view engine setup
app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/movies', express.static(path.join(__dirname, 'public')));
app.use('/movie', express.static(path.join(__dirname, 'public')));
/*** For login ***/
app.use(cookieParser());
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(flash());
app.use(passport.session());


/* Configure Router in spearates files
var index = require('./routes/index');
var movie = require('./routes/movie');
var users = require('./routes/users');

app.use('/', index);
//app.use('/movies', index);
app.use('/movie', movie);
//app.use('/users', users); */
var api = require("./notshare/api.json");
/*** MongoDB parameters ***/
var mongodb_url = 'mongodb://localhost:27017/remotepop';
var mongodb_url2 = 'mongodb://localhost:27017/popcorn';

/* passport config */
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());
// mongoose
mongoose.connect(mongodb_url);


/*** Router configuration */
var router = express.Router();

router.use(function (req,res,next) {
  //console.log("/" + req.method);
  next();
});

router.get("/", function(req,res) {
  res.redirect('/movies')

});

/* Routes for login */
var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
  return next();
  // if the user is not authenticated then redirect him to the login page
  /*** DISABLE AUTHENTIFICATION FOR DEV ***/
  //res.redirect('/login');
  return next();
}

var pages_layout = function(current_page, count, callback){
  var start = current_page > 3 ? current_page-2 : 1;
  var end = current_page < count-3 ? start+5 : count +1;

  var pages = [];
  for(i = start; i < end; i++){
    pages.push(do_page_button(i, i, i===current_page));
  }
  if(current_page < count-3){
    pages.push(do_page_button('...', current_page, false));
    pages.push(do_page_button(count, count, false));
  }
  callback(pages, current_page!==1, current_page!==count);
}

var do_page_button = function(number, link, active){
  var page = new Object();
  page["number"] = number;
  page["link"] = link;
  page["active"] = active;
  return(page)
}

router.get('/login', (req, res) => {
  res.render('login', {layout: 'blank'});
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), (req, res, next) => {
  req.session.save((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/movies');
  });
});
router.get('/logout', (req, res, next) => {
  req.logout();
  req.session.save((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});
router.post('/register', (req, res, next) => {
  Account.register(new Account({ username : req.body.username }), req.body.password, (err, account) => {
    if (err) {
      return res.render('register', {error : err.message });
    }
    passport.authenticate('local')(req, res, () => {
      req.session.save((err) => {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
});
/***/

router.get("/movies", function(req,res) {
  res.redirect('/movies/1')
});

router.get('/movies/:id', isAuthenticated, function(req, res, next) {
  MongoClient.connect(mongodb_url2, function(err, db) {
    assert.equal(null, err);
    var current_page = parseInt(req.params.id);

    if(req.query.keywords){
      var query = { $text: { $search: req.query.keywords }}
      var options = {limit: 50, sort:[['torrents.en.1080p.seed' , 'desc']]};
    } else {
      var skip = (current_page - 1) * 50;
      var query = {}
      var options = {limit: 50, skip: skip,sort:[['torrents.en.1080p.seed' , 'desc']]};
    }

    db.collection('movies').find(query, options).toArray(function(err, body) {
      assert.equal(null, err);
      var movies = new Object();
      db.collection('movies').count(function(err, count){
        assert.equal(null, err);
        pages_layout(current_page, count, function(pages, prev, next){
          movies["movie"] = body;
          // DISABLE FOR DEV
          //movies["username"] = req.user.username;
          movies["username"] = 'Jean-Pierre'
          movies["page"] = pages;
          if(prev) movies["prev"] = current_page-1;
          if(next) movies["next"] = current_page+1;
          res.render("index", movies);
          db.close();
        });
      });
    });
  });
});

router.get('/movie/:id', isAuthenticated, function(req, res, next) {
  MongoClient.connect(mongodb_url2, function(err, db) {
    assert.equal(null, err);
    db.collection('movies').findOne({_id: req.params.id}, function(err, body) {
      assert.notEqual('', body);
      var movie = body;
      console.log(JSON.stringify(body))
      if (movie["trailer"] !== null) {
        var link = movie["trailer"].split("=");
        movie["youtube"] = link[1];
      }
      // DISABLE FOR DEV
      //movie["username"] = req.user.username;
      movie["username"] = 'Jean-Pierre'
      res.render("movie", movie);
    });
  });
});

router.post('/download', function(req, res) {
  //console.log("Downloads id: " + JSON.stringify(req.body));
  var ssn_user = req.session.passport.user;
  request(api.ip + '/movie/' +
  //request('http://localhost:5000/movies/' +
  req.body.id, function (err, response, body) {
    //console.log("body= " + body);
    var movie = JSON.parse(body);
    movie['user'] = ssn_user;
    console.log(movie);
    MongoClient.connect(mongodb_url, function(err, db) {
      db.collection('download').save(movie, function(err, result) {
        assert.equal(null, err);
        console.log(movie.title + ' saved to database');
        db.close();
      });
    });
  });
});

router.get('/downloads',function(req,res){
  console.log("get downloads server");
  var json = [{title: 'Toy Story 2677'}];
  //res.json(json)
  MongoClient.connect(mongodb_url, function(err, db) {
    assert.equal(null, err);
    db.collection('download').find({}).toArray(function(err, movies) {
      assert.equal(null, err);
        db.close();
        res.json(movies);
    });
  });
});

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
