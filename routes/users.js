var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res) {
  User.find().exec(function(err, users) {
    res.render('list', {title: 'users list', users: users});
  });
});

//* GET one user. */
router.get('/:id', function(req, res, next) {
  console.log(req.param('id'));
  User.findOne({_id: req.param('id')}).exec(function(err, user) {
    console.log(user);
    if(err) {
      res.render('user', {
        title: 'ユーザー参照エラー',
        errors: err.errors
      });
    } else {
      res.render('user', {
        user: user
      });
    }
  });
});

module.exports = router;