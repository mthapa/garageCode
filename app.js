var express = require('express'),
	path = require('path'),
	config = require('./config'),
	async = require('async'),
	gpio = require('./pi-gpio'),
	app = express();
	passport = require('passport');
	Strategy = require('passport-facebook').Strategy;

app.set('port', process.env.PORT || 3000);


// Madan's Code

passport.use(new Strategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/login/facebook/return'
  },
  function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
  }));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
//app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Define routes.
app.get('/',
  function(req, res) {
    res.render('home', { user: req.user });
  });

app.get('/login',
  function(req, res) {
    res.render('login');
  });

app.get('/login/facebook',
  passport.authenticate('facebook'));

app.get('/login/facebook/return', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

//Adding Logout Functionality
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/'); 
});

app.get('/dashboard',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('dashboard', { user: req.user });
  });


app.use('/', express.static(__dirname + '/public'));

function delayPinWrite(pin, value, callback) {
	setTimeout(function() {
		gpio.write(pin, value, callback);
	}, config.RELAY_TIMEOUT);
}

app.get("/api/ping", function(req, res) {
	res.json("pong");
});

app.post("/api/garage/left", function(req, res) {
	async.series([
		function(callback) {
			// Open pin for output
			gpio.open(config.LEFT_GARAGE_PIN, "output", callback);
		},
		function(callback) {
			// Turn the relay on
			gpio.write(config.LEFT_GARAGE_PIN, config.RELAY_ON, callback);
		},
		function(callback) {
			// Turn the relay off after delay to simulate button press
			delayPinWrite(config.LEFT_GARAGE_PIN, config.RELAY_OFF, callback);
		},
		function(err, results) {
			setTimeout(function() {
				// Close pin from further writing
				gpio.close(config.LEFT_GARAGE_PIN);
				// Return json
				res.json("ok");
			}, config.RELAY_TIMEOUT);
		}
	]);
});

app.post("/api/garage/right", function(req, res) {
	async.series([
		function(callback) {
			// Open pin for output
			gpio.open(config.RIGHT_GARAGE_PIN, "output", callback);
		},
		function(callback) {
			// Turn the relay on
			gpio.write(config.RIGHT_GARAGE_PIN, config.RELAY_ON, callback);
		},
		function(callback) {
			// Turn the relay off after delay to simulate button press
			delayPinWrite(config.RIGHT_GARAGE_PIN, config.RELAY_OFF, callback);
		},
		function(err, results) {
			setTimeout(function() {
				// Close pin from further writing
				gpio.close(config.RIGHT_GARAGE_PIN);
				// Return json
				res.json("ok");
			}, config.RELAY_TIMEOUT);
		}
	]);
});

app.post("/api/garage/both", function(req, res) {
	async.series([
		function(callback) {
			// Open pin for output
			gpio.open(config.LEFT_GARAGE_PIN, "output", callback);
		},
		function(callback) {
			// Open pin for output
			gpio.open(config.RIGHT_GARAGE_PIN, "output", callback);
		},
		function(callback) {
			// Turn the relay on
			gpio.write(config.LEFT_GARAGE_PIN, config.RELAY_ON, callback);
		},
		function(callback) {
			// Turn the relay on
			gpio.write(config.RIGHT_GARAGE_PIN, config.RELAY_ON, callback);
		},
		function(callback) {
			// Turn the relay off after delay to simulate button press
			delayPinWrite(config.LEFT_GARAGE_PIN, config.RELAY_OFF, callback);
		},
		function(callback) {
			// Turn the relay off after delay to simulate button press
			delayPinWrite(config.RIGHT_GARAGE_PIN, config.RELAY_OFF, callback);
		},
		function(err, results) {
			setTimeout(function() {
				// Close pin from further writing
				gpio.close(config.LEFT_GARAGE_PIN);
				gpio.close(config.RIGHT_GARAGE_PIN);
				// Return json
				res.json("ok");
			}, config.RELAY_TIMEOUT);
		}
	]);
});

app.listen(app.get('port'), function(){
	console.log("Server listening on port 3000...");
});
