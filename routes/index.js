var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("index");
  console.log(req.session.passport);
  res.render('index', {
    title: 'login demo',
    session: req.session.passport //passportでログイン後は、このオブジェクトに情報が格納されます。
  });
});

module.exports = router;