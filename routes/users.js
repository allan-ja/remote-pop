var express = require('express');
var request = require("request");
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  request('https://tv-v2.api-fetch.website/movies/1', function (err, response, body) {
      if(err) {
        console.log("err: " + err);
      } else {
        var movies = new Object();
        if (body != '') {
          movies["movie"] = JSON.parse(body);
          //console.log("json parsed, title: " + movies);
          res.render("index", movies);
        }
      }
  });
});

module.exports = router;
