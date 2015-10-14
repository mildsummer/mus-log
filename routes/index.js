var express = require('express');
var router = express.Router();
var User = require('../models/user');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("index");
  var passport = req.session.passport;
  if(!passport) {
    res.render('login');
  }
  User.findOne({_id: passport.user.id}).populate('contributions').exec(function(err, user) {
    if(!err) {
      if(!user) {//初めてログインした場合はユーザー情報を保存
        var user = new User({_id: passport.user.id, name: passport.user.displayName});
        user.save(function(err) {
          if(!err) {
            res.render('index', {
              title: 'ユーザー登録を完了しました',
              session: passport
            });
          } else {
            res.render('error', {
              error: err,
              message: 'ユーザー登録エラー'
            });
          }
        });
      } else {
        res.render('index', {
          title: 'ユーザー登録済みです',
          session: passport
        });
      }
    } else {
      res.render('error', {
        error: err,
        message: 'ユーザー参照エラー'
      });
    }
  });
});

module.exports = router;