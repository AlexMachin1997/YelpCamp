//Express Dependency
var express = require("express"),
    router = express.Router();

//Schemas 
var User = require("../models/user");

//NodeMailer
var nodemailer = require("nodemailer");

//Async - Comes With Express 
var async = require("async");

//Crpyto Key Package
var crypto = require("crypto");


// forgot password route
router.get('/forgot', function (req, res) {
    res.render('forgot');
});


//Forgot Post Route
router.post('/forgot', function (req, res, next) {

    //Executes Multiple Functions
    async.waterfall([
    function (done) {

            //Generates Crypto Key
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
    },

    //Token FUnction
    function (token, done) {

            User.findOne({ email: req.body.email }, function (err, user) {

                //No Email If The Email Doesnt Exist Then 
                if (!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                //Set As A Token
                user.resetPasswordToken = token;

                //Token Lasts 1 hour (3600000ms)
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                //Saves Token
                user.save(function (err) {
                    done(err, token, user);
                });
            });
    },

    //Token And Email
    function (token, user, done) {

            //Credentials For Email 
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail', //Provider
                port: 465, //Port Number
                secure: true, //Secure 

                //Authentication Object
                auth: {
                    user: 'alexmachinapi@gmail.com',
                    pass: process.env.GMAILPW
                }
            });

            //Creating The Mail  Layou
            var mailOptions = {
                to: user.email,
                from: 'YelpCamp Team',
                subject: 'YelpCamp Password Reset Request',
                text: 'Hey ' + user.fullName + '\n\n' +
                    'You are receiving this because Your Account Has Just Requested A Password Reset. \n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };

            //Sending Email
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
    }

  //Any Errors     
  ], function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});


//Route For Reset Token
router.get('/reset/:token', function (req, res) {

    //Fins Reset Token 
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {

        //If the token has expeired or doesnt exist then
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        //If it does exist then render forgot page
        res.render('reset', { token: req.params.token });
    });
});

//Post Route For New Password
router.post('/reset/:token', function (req, res) {

    //Executes Multiple Functions
    async.waterfall([
    function (done) {
                User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                    if (!user) {
                        req.flash('error', 'Password reset token is invalid or has expired.');
                        return res.redirect('back');
                    }

                    //If passwords Match Then
                    if (req.body.password === req.body.confirm) {
                        user.setPassword(req.body.password, function (err) {
                            user.resetPasswordToken = undefined;
                            user.resetPasswordExpires = undefined;
                            user.save(function (err) {
                                req.logIn(user, function (err) {
                                    done(err, user);
                                });
                            });
                        });
                    }

                    //If they dont match thengo back and display error message
                    else {
                        //Flash Message
                        req.flash("error", "Passwords do not match.");

                        //Redirects User
                        return res.redirect('back');
                    }
                });
    },

    //Password Conformation
    function (user, done) {
                //Credentials
                var smtpTransport = nodemailer.createTransport({
                    service: 'Gmail',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'alexmachinapi@gmail.com',
                        pass: process.env.GMAILPW
                    }
                });

                //Creating Email
                var mailOptions = {
                    to: user.email,
                    from: 'YelpCamp Team ',
                    subject: 'Password Change Conformation',
                    text: 'Hey, ' + user.fullName + '\n\n' +
                        'Your Accounts Password Has Just Been Changed has just been changed. If You Didnt Request This Email Conctact Support, But If You Did Ignore This \n'
                };

                //Flash Message
                smtpTransport.sendMail(mailOptions, function (err) {
                    req.flash('success', 'Success! Your password has been changed.');
                    done(err);
                });
    }
    ],
        //Then Redirect To Campgrounds Page
        function (err) {
            res.redirect('/campgrounds');
        });
});

module.exports = router;
