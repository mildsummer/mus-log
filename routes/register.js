var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET register page. */
router.get('/', function(req, res) {
  res.render('register');
});

router.post('/', function(req, res) {
  console.log(req.body);
  var newUser = new User(req.body);
  newUser.save(function(err) {
    console.log(err);
    if (err) {
      res.render('register', {
        title: 'ユーザ登録エラー',
        errors: err.errors
      });
    } else {
      //req.session.name = req.body.name;
      res.redirect('/users/' + newUser._id);
    }
  });
});

module.exports = router;