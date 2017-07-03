var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var request = require("request");
var MongoClient = require('mongodb').MongoClient
var logger = require('morgan');

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
	res.redirect('/login');
}
var pages_layout = function(cur_page, callback){
  request(api.ip + '/movies/', function (err, response, body) {
      if(err) {
        console.log("err: " + err);
      } else {
        list = JSON.parse(body);
        //var start = 0;
        var start = cur_page > 3 ? cur_page-2 : 1;
        var end = cur_page < list.length-3 ? start+5 : list.length+1;

        var pages = [];
        for(i = start; i < end; i++){
          pages.push(do_page(i, i, i===cur_page));
        }
        if(cur_page < list.length-3){
          pages.push(do_page('...', '', false));
          pages.push(do_page(list.length, list.length, false));
        }
        //console.log(JSON.stringify(pages));
        callback(pages, cur_page!==1, cur_page!==list.length);
      }
    });
  }
var do_page = function(number, link, active){
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
  console.log(req.params);
  console.log("url:"+api.ip + '/movies/' + 1 + "?keywords=" + req.query.keywords);

  /*if(req.query.keywords){
    request(api.ip + '/movies/' + 1 + "?keywords=" + req.query.keywords, function (err, response, body) {
    //request('http://localhost:5000/movies/' + id, function (err, response, body) {
        if(err) {
          console.log("err: " + err);
        } else {
          var movies = new Object();
          console.log("body: " + body);
          if (body !== '') {
            movies["movie"] = JSON.parse(body);
            //movies["movie"] = [];
            movies["username"] = req.user.username;
            res.render("index", movies);
          }
        }
      });

        }
    });
  }*/

  var id = req.params !== '' ? req.params.id : 1;
  request(api.ip + '/movies/' + id, function (err, response, body) {
  //request('http://localhost:5000/movies/' + id, function (err, response, body) {
      if(err) {
        console.log("err: " + err);
      } else {
        var movies = new Object();
        if (body != '') {
          var current_page = parseInt(req.params.id);
          pages_layout(current_page, function(pages, prev, next){
            movies["movie"] = JSON.parse(body);
            //movies["movie"] = [];
            movies["username"] = req.user.username;
            movies["page"] = pages;
            if(prev) movies["prev"] = current_page-1;
            if(next) movies["next"] = current_page+1;
            res.render("index", movies);
          });
        }
      }
  });
});

router.get('/movie/:id', isAuthenticated, function(req, res, next) {
  request(api.ip + '/movie/' + req.params.id, function (err, response, body) {
      if(err) {
        console.log("err: " + err);
      } else {
        if (body != '') {
          var movie = JSON.parse(body);
          var link = movie["trailer"].split("=");
          //console.log("json parsed, youtube: " + link[1]);
          movie["username"] = req.user.username;
          movie["youtube"] = link[1];
          res.render("movie", movie);
        }
      }
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
      //console.log("Connected correctly to server");

      db.collection('download').save(movie, function(err, result) {
      if (err) return console.log(err)
      console.log(movie.title + ' saved to database');
      db.close();
      });
    });
  });
});

/**
router.post('/download', function(req, res) {
  console.log("Downloads id: ");
  MongoClient.connect(mongodb_url, function(err, db) {
    console.log("Connected correctly to server");
    db.collection('download').save(req.body, function(err, result) {
      if (err) return console.log(err)
      console.log(req.body.title + ' saved to database');
      db.close();
    });
  });
});**/

router.get('/downloads',function(req,res){
  console.log("get downloads server");
  var json = [{title: 'Toy Story 2677'}];
  //res.json(json)
  MongoClient.connect(mongodb_url, function(err, db) {
    if (err) {
      console.log(err)
    } else {
      db.collection('download').find({}).toArray(function(err, movies) {
        if(err){
          console.log(err);
        } else {
          //console.log("docs = " + JSON.stringify(movies));
          db.close();
          res.json(movies);
        }
      });
    }
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
