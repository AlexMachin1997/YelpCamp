var Campground = require("../models/campground"),
    Comment = require("../models/comments"),
    middlewareObj = {},
    User = require("../models/user")

//Checks If The User Owns The Campground Or Not 
middlewareObj.checkCampgroundOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id, function (err, foundCampground) {
            if (err) {
                req.flash("error", "Campground Not Found");
                res.redirect("back");
            }
            else {
                // does user own the campground?
                if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                }
                else {
                    req.flash("error", "Sorry You Dont Have Permission To Do That");
                    res.redirect("back");
                }
            }
        });
    }
    else {
        req.flash("error", "To Access This Feature You Will Need To First Login Or Register To Continue.");
        res.redirect("back");
    }
};

//Checks If The User Owns The Comment Or Not 
middlewareObj.checkCommentOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err) {
                res.redirect("back");
            }
            else {
                // does user own the comment?
                if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                }
                else {
                    req.flash("error", "Looks Like You Dont Have Permission To Do That");
                    res.redirect("back");
                }
            }
        });
    }
    else {
        req.flash("error", "You Need To Be Logged In To Do That");
        res.redirect("back");
    }
};

//Checks If The User Is Logged In Or Not 
middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "To Access This Feature You Will Need To First Login Or Register To Continue.");
    res.redirect("/login");
};


//Checks User Ownership
middlewareObj.checkUserOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        User.findById(req.params.id, function (err, foundUser) {
            if (err || !foundUser) {
                req.flash("error", "Specific User not found!");
                res.redirect("/campgrounds");
            }
            else {
                if (foundUser._id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                }
                else {
                    // othwerwise, redirect
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("/campgrounds");
                }
            }
        });
    }
    else {
        // if not, redirect
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("/campgrounds");
    }
};


//Exports All Middleware 
module.exports = middlewareObj;
