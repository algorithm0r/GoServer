var start = function () {
    var that = this;
    var express = require("express");
    var bodyParser = require("body-parser");
    var cookieParser = require("cookie-parser");
    var methodOverride = require("method-override");
    var session = require("express-session");
    var morgan = require("morgan");

    var passport = require("passport");
    var LocalStrategy = require("passport-local").Strategy;

    var findById = function (id, fn) {
        console.log("Find by id : " + id);
        var ObjectID = require('mongodb').ObjectID;
        var oid = new ObjectID(id);
        db.users.find({ _id: oid }, function (err, users) {
            console.log(users);
            var user = users[0];
            if (user) {
                fn(null, user);
            }
            else {
                fn(new Error('User ' + id + ' does not exist!'));
            }
        });
    }

    var findByUsername = function (username, fn) {
        console.log("Find by username : " + username);
        db.users.find({ username: username }, function (err, users) {
            var user = users[0];
            if (user) {
                console.log(user);
                fn(null, user);
            }
            else {
                fn(null, null);
            }
        });
    }

    var ensureAuthenticated = function (req, res, next) {
        console.log("Ensure Authenticated");
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/login');
    }

    passport.serializeUser(function (user, done) {
        console.log(user);
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy(function (username, password, done) {
        console.log("Processing authentication.");
        findByUsername(username, function (err, user) {
            if (err) {
                console.log("Error authenticating: " + err);
                return done(err, false);
            }
            if (!user) {
                console.log("Username not found.");
                return done(null, false, { message: 'Unknown username.' });
            }
            bcrypt.compare(password, user.password, function (err, res) {
                if (!res)
                    return(done(new Error("Wrong password.")));
            });
            console.log("Authenticated!");
            return done(null, user);
        });
    }));

    var app = express();
    var port = 8888;

    var db = require('./db').DB;
    var bcrypt = require("bcrypt-nodejs");

    var dungeonName = "small";

    var GameBoard = require('./public/gameboard').GameBoard;

    var gameboard = new GameBoard();

    app.set('views', __dirname + '/tpl');
    app.set('view engine', "jade");
    app.engine('jade', require('jade').__express);
    
    app.use(morgan());
    app.use(cookieParser());
    app.use(bodyParser());
    app.use(methodOverride());
    app.use(session({ secret: "algorithm demon" }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static(__dirname + '/public'));
    
    // default to login
    app.get("/", function (req, res) {
        res.render("login");
    });

    // login screen
    app.get("/login", function (req,res) {
        res.render("login");
    });

    // handling a login attempt
    app.post('/login', function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {
            if (err) { return next(err); }
            if (!user) {
                console.log("User not found.");
                return res.redirect('/login');
            }
            req.logIn(user, function (err) {
                if (err) { return next(err); }
                return res.redirect('/lobby');
            });
        })(req, res, next);
    });

    // displaying the registration form
    app.get('/reg', function (req, res) {
        res.render("register");
    });

    // handling a new registration form
    app.post('/reg', function (req, res, next) {
        // req.body.[field] contains the post information from the form
        // see for yourself and uncomment below

        // console.log(req.body);

        // if the two typed passwords match
        if (req.body.password === req.body.repassword) {
            // find if username is taken
            db.users.find({ username: req.body.username }, function (err, users) {
                // users is a list of records (possibly of size 1) we'll take the first one
                var user = users[0];
                // if the user exists
                if (user) {
                    res.send("Username taken.");
                }
                else {
                    // if user doesn't exist
                    // hash their password and
                    // add new user to database
                    bcrypt.hash(req.body.password, null, null, function (err, hash) {
                        db.users.insert({ username: req.body.username, password: hash, email: req.body.email });
                    });
                    res.render("login");
                }
            });
        }
        else {
            res.send("Passwords don't match.");
        }
    });

    // game lobby
    app.get('/lobby', ensureAuthenticated, function (req, res) {
        res.render("lobby", { username: req.user.username });
    });

    var io = require('socket.io').listen(app.listen(port));
    var socketsCreated = 0;
    var numSockets = 0;

    // turn off debugging
    io.set('log level', 0);

    io.sockets.on('connection', function (socket) {

        socket.emit('start');

        socket.emit('message', { message: 'welcome to the chat' });

        socket.on('init', function (data) {
            socketsCreated++;
            numSockets++;

            socket.username = data;
            io.sockets.emit('sync', gameboard);
        });

        socket.on('send', function (data) {
            io.sockets.emit('message', data);
        });

        socket.on('click', function (data) {
            io.sockets.emit('click', data);
            gameboard.move(data.click.x, data.click.y);
        });

        socket.on('disconnect', function () {
            numSockets--;
        });

        var timeSyncTimer = setInterval(function () {
            socket.emit('sync', gameboard);
        }, 2000);

    });
}

exports.start = start;