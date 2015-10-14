var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
mongoose.connect('mongodb://heroku_7gfj5pff:3unsj9ohgopba69l4q9h4qrjbf@ds051893.mongolab.com:51893/heroku_7gfj5pff');
var flash = require('connect-flash');

var routes = require('./routes/index');
var oauth = require('./routes/oauth');
var users = require('./routes/users');
var register = require('./routes/register');
var contributes = require('./routes/contributes');

//Twitter OAuth
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

//Twitter Appsにて取得したConsumer Key (API Key)とConsumer Secret (API Secret)を記述
var TWITTER_CONSUMER_KEY = "k3r6wTKnnX8QnK47ek2axO2fk";
var TWITTER_CONSUMER_SECRET = "zlPQduFRktR3zKUgO8tJNVzh3eAjPSEWNxpZ9lipxAfP9jfK6i";

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "/oauth/callback" //Twitterログイン後、遷移するURL
  },
  function (token, tokenSecret, profile, done) {
    console.log(token, tokenSecret, profile);
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//session
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/', routes);
app.use('/oauth', oauth);
app.use('/users', users);
app.use('/register', register);
app.use('/contributes', contributes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(3000);

module.exports = app;