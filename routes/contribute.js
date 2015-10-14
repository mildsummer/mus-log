var express = require('express');
var router = express.Router();
var request = require('request');
var Contribution = require('../models/contribution');

/* POSR contribute. */
router.post('/', function(req, res) {
  console.log(req.body);
  request(req.body.url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(body);
      var base64prefix = 'data:' + response.headers['content-type'] + ';base64,';
      var image = body.toString('base64');
      var contribution = new Contribution({
        text: req.body.text,
        base64: (image + base64prefix),
        user: req.session.passport.user.id
      });
      contribution.save(function(err) {
        if(!err) {
          res.render('index', {
            title: '投稿を完了しました',
            session: req.session.passport
          });
        } else {
          res.render('error', {
            error: err,
            message: '投稿エラー'
          });
        }
      });
    } else {
      console.log('error: '+ response.statusCode);
    }
  })
});

module.exports = router;