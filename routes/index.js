var express = require('express');
var request = require("request");
var router = express.Router();

/* GET home page. */
router.get('/movies/:id', function(req, res, next) {
    request('https://tv-v2.api-fetch.website/movies/' + req.params.id, function (err, response, body) {
      if(err) {
        console.log("err: " + err);
      } else {
        //console.log('Response:', body);
        //console.log("json title: " + body.title);
        if (body != '') {
          var movies = new Object();
          movies["movie"] = JSON.parse(body);
        console.log("json parsed, title: " + movies);
        res.render("index", movies);
    }}});
    //var test = {people: ['allan', 'robs', 'toto']};
    //var movies = {title: "Pulp Fiction", "image": "img/pulp-fiction.png"};
  //res.render('index', movies);
});

module.exports = router;
