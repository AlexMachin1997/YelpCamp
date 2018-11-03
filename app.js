//Required As First Package
require('dotenv').config();

//Dependencies For Application
var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    flash = require("connect-flash"),
    expressSanitizer = require("express-sanitizer"),
    helmet = require('helmet'),
    cookieParser = require("cookie-parser");


//Safeguard 
app.use(helmet());

//Mongoose Related
mongoose.Promise = global.Promise;


//Temp Data
//seedDB = require("./seeds");

//-----------------------------------------------------------------------------//
//-----------------------------------Modules-----------------------------------//
//-----------------------------------------------------------------------------//

//Campground Ground Schema File
var Campground = require("./models/campground");

//Campground Ground Schema File
var Comment = require("./models/comments");

var User = require("./models/user");

var request = require("request");

//-----------------------------------------------------------------------------//
//-----------------------------------Routes------------------------------------//
//-----------------------------------------------------------------------------//

var commentRoutes = require("./routes/comments");
var campgroundRoutes = require("./routes/campgrounds");
var indexRoutes = require("./routes/index");
var userRoutes = require("./routes/user");
var forgotRoutes = require("./routes/forgot");

//-----------------------------------------------------------------------------//
//-----------------------------Database Connection-----------------------------//
//-----------------------------------------------------------------------------//

//Live Database             //Local Database                         
var db = process.env.DATABASEURL || "mongodb://localhost/yelpcamp";
//console.log(process.env.DATABASEURL);

//Starts Connection
mongoose.connect(db);

//-----------------------------------------------------------------------------//
//-------------------------------App.use & App.set-----------------------------//
//-----------------------------------------------------------------------------//

//View Directory Files AAre Automatically Presumed To Be EJS Files
app.set("view engine", "ejs");

//Gets Dat From Forms
app.use(bodyParser.urlencoded({ extended: true }));

//Links To Public Directory
app.use(express.static(__dirname + "/public"));

//Used For Put Request 
app.use(methodOverride("_method"));

//Test Data - Not Needed Anymore
//seedDB(); 

//Connect Flash
app.use(flash());

//Moment JS
app.locals.moment = require('moment');

//Sanitizer
app.use(expressSanitizer());

//Cookie Parser
app.use(cookieParser());




//-----------------------------------------------------------------------------//
//-------------------------------Passport JS Config----------------------------//
//-----------------------------------------------------------------------------//

app.use(require("express-session")({
    secret: "Once Again Rusty Is The Best",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//Comes From From User.js model
passport.use(new LocalStrategy(User.authenticate()));

//Creates Session When User Logs In
passport.serializeUser(User.serializeUser());

//Removes Session When User Logs Out
passport.deserializeUser(User.deserializeUser());


//Custom Middle Ware

//Gloal Data 
app.use(function (req, res, next) {

    //Used In Headere.ejs - Shows Current User Which Is Logged In
    res.locals.currentUser = req.user;


    //Flash Message Configuratiion - Styled Using Bootstrap
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});


//Acts As Placeholder For Routes 
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/users/", userRoutes);
app.use(forgotRoutes);



//----------------------------------------------------------------------------//
//-------------------------------404 Route------------------------------------//
//----------------------------------------------------------------------------//

app.get("*", function (req, res) {
    res.render("404");
});

//----------------------------------------------------------------------------//
//---------------------------------Server Message-----------------------------//
//----------------------------------------------------------------------------//
var port = 3000 ;

app.listen(port, function () {
    console.log("Welcome To The YelpCamp Server");
});
