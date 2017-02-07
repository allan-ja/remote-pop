var express = require('express');
var request = require("request");
var router = express.Router();

/* GET home page. */
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


module.exports = router;
