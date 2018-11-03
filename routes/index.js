//----------------------------------------------------------------------------//
//--------------------------Dependencies For Route----------------------------//
//----------------------------------------------------------------------------//

//Express Dependency
var express = require("express"),
    router = express.Router();

//Login Dependency     
var passport = require("passport");

//Schemas 
var User = require("../models/user");

//Google Recaptcha Dependences
var request = require("request");


//----------------------------------------------------------------------------//
//--------------------------Index Route Of Application------------------------//
//----------------------------------------------------------------------------//

router.get("/", function (req, res) {

    //Displays Landing Page    
    res.render("landing", { page: 'landing' });

});

//----------------------------------------------------------------------------//
//-----------------------------Shows Register Route---------------------------//
//----------------------------------------------------------------------------//

router.get("/register", function (req, res) {
    //Displays Register Page
    res.render("register", { page: 'signUp' });

});


// handle signup logic
router.post("/register", function (req, res) {
    
    //Google Captcha Functionality 
    const captcha = req.body["g-recaptcha-response"];

    //If there is no captcha response then
    if (!captcha) {
        console.log(req.body);
        req.flash("error", "Please select captcha");
        return res.redirect("/register");
    }

    // secret key for recaptcha
    var secretKey = process.env.CAPTCHA;

    // Verify URL
    var verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req.connection.remoteAddress}`;

    // Make request to Verify URL
    request.get(verifyURL, (err, response, body) => {

        if (body.success !== undefined && !body.success) {
            req.flash("error", "Captcha Failed");
            return res.redirect("/register");
        }

        //New User Object
        var newUser = new User({
            username: req.body.username,
            fullName: req.body.fullName,
            email: req.body.email,
            bio: req.body.bio,
            password: req.body.password,
        });

        //Default AvatarFor User
        newUser.avatar = "/images/Default-Image.jpg";

        //Admin Code - If Input Is ADMINCODE Then Set To True
        if (req.body.adminCode === process.env.ADMINCODE) {
            newUser.isAdmin = true;
        }


        //Reigster New User 
        User.register(newUser, req.body.password, function (err, user) {

            if (err) {

                //Logs Error
                console.log(err.message);

                //Flahs Message
                req.flash("error", "Something Has Gone Wrong");

                //Redirects The User Back To Register Form
                return res.render("register");
            }

            //After Registering Passports Authenticates The New User And Logs Them In
            passport.authenticate("local")(req, res, function () {

                //After Registering The Account Is Logged 
                //Flash Message                
                req.flash("success", "Welcome to YelpCamp " + user.username);

                //Redirect
                res.redirect("/campgrounds");
            }); //Ends Passport Authentication
        }); //Ends Register Functionality
    }); // Request Functionlity Ends Here
}); //Ends Register Post Route


//----------------------------------------------------------------------------//
//--------------------------------Shows Log In Form---------------------------//
//----------------------------------------------------------------------------//

//Get Route
router.get("/login", function (req, res) {

    //Redirects To Login And Makes Login Link Active
    res.render("login", { page: 'login' });
});

//----------------------------------------------------------------------------//
//------------------------------Login Form Logic------------------------------//
//----------------------------------------------------------------------------//

//Post Rout
router.post("/login", function (req, res, next) {
    
    //Uses Local Authenticate Stratergy
    passport.authenticate("local", {
        
        //Details Match
        successRedirect: "/campgrounds",

        //Details Dont Match
        failureRedirect: "/login",

        //Success Message
        successFlash: "Welcome Back To YelpCamp " + req.body.username + "!",

        //Failure Message
        failureFlash: "Login failed, invalid credentials Entered."
        
    })(req, res);
});
//----------------------------------------------------------------------------//
//-------------------------------Logout Logic---------------------------------//
//----------------------------------------------------------------------------//

//Get Route
router.get("/logout", function (req, res) {

    //Logout Method - Passport Method Executed
    req.logout();

    //Flash Message
    req.flash("success", "You Have Successfully Been Logged Out");

    //Redirects
    res.redirect("/campgrounds");
});

//----------------------------------------------------------------------------//
//---------------------------------Exports Data-------------------------------//
//----------------------------------------------------------------------------//
module.exports = router;
