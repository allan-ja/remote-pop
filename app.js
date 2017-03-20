var express = require('express');
var path = require('path');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var request = require("request");
var MongoClient = require('mongodb').MongoClient



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

/*** MongoDB parameters ***/
var db;
var mongodb_url = 'mongodb://localhost:27017/remotepop';

MongoClient.connect(mongodb_url, function(err, database) {
  console.log("Connected correctly to server");
  db = database;
});

var findDocuments = function(callback) {
  // Get the documents collection
 db.collection('download').collection.find({}).toArray(function(err, docs) {
    console.log("Found the following records");
    console.log(docs)
    callback(docs);
  });
}

var clearDownloads = function(){
  MongoClient.connect(mongodb_url, function(err, db) {
    console.log("Connected correctly to server");
    db.collection('download').remove({});
    console.log("downloads collection cleared");
  });
}
clearDownloads();
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
  request('http://localhost:5000/movies/' + id, function (err, response, body) {
  //request('http://localhost:5000/movies/' + id, function (err, response, body) {
      if(err) {
        console.log("err: " + err);
      } else {
        var movies = new Object();
        if (body != '') {
          console.log(body);
          movies["movie"] = JSON.parse(body);
          res.render("index", movies);
        }
      }
  });
});

router.get('/movie/:id', function(req, res, next) {
  request('http://localhost:5000/movie/' + req.params.id, function (err, response, body) {
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
  console.log("Downloads id: " + JSON.stringify(req.body));
  request('http://localhost:5000/movie/' +
  //request('http://localhost:5000/movies/' +
   req.body.id, function (err, response, body) {
    //console.log("body= " + body);
    var movie = JSON.parse(body);
    console.log(body);
    MongoClient.connect(mongodb_url, function(err, db) {
      console.log("Connected correctly to server");
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
