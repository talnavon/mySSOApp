var https = require('https')
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var passport = require('passport');
var session = require('express-session');
var fs = require('fs');

var SamlStrategy = require('passport-saml').Strategy;
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});
passport.use(new SamlStrategy(
  {
    path: '/login/callback',
//    entryPoint: 'https://login.windows.net/16d103a1-a264-4d36-9b52-51fa01ce5c2e/saml2',
    entryPoint: 'https://login.microsoftonline.com/51521dda-2781-4b7f-a789-5ee8edfb5793/saml2',
    issuer: 'login-ass-saml',
//    cert: fs.readFileSync('login-ass-saml.pem', 'utf-8'),
    signatureAlgorithm: 'sha256'
  },
  function(profile, done) {
    return done(null,
    {
      id: profile['nameID'],
      email: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      displayName: profile['http://schemas.microsoft.com/identity/claims/displayname'],
      firstName: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
      lastName: profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']
    });
  })
);




var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session(
  {
    resave: true,
    saveUninitialized: true,
    secret: 'this shit hits'
  }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/login',
  passport.authenticate('saml', {
    successRedirect: '/',
    failureRedirect: '/login' })
  );
app.post('/login/callback',
  passport.authenticate('saml', {
    failureRedirect: '/',
    failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  }
);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
