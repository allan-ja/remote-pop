var express = require('express');
var request = require("request");
var router = express.Router();

/* GET home page. */
router.get('/:id', function(req, res, next) {
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

module.exports = router;
