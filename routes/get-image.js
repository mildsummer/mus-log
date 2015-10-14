var express = require('express');
var router = express.Router();
var request = require('request');

/* GET register page. */
router.get('/', function(req, res) {
  var url = req.query.url;
  request(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body.toString('base64'));
      res.render()
    } else {
      console.log('error: '+ response.statusCode);
    }
  })
});

module.exports = router;