//----------------------------------------------------------------------------//
//--------------------------Dependencies For Route----------------------------//
//----------------------------------------------------------------------------//

var express = require("express"),
    router = express.Router();

var User = require("../models/user"),
    Campground = require("../models/campground"),
    Comment = require("../models/comments");

var middleware = require("../middleware");


var multer = require("multer");

//Multer Storage 
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});

//Multer Filter
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

//Storing Image + Filter
var upload = multer({ storage: storage, fileFilter: imageFilter });

//Cloudinary Configuration 
var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.Cloud_Name,
    api_key: process.env.Cloud_Key,
    api_secret: process.env.Cloud_Sec
});

//----------------------------------------------------------------------------//
//-------------------------------Show Profile Route---------------------------//
//----------------------------------------------------------------------------//

//Unique URL - Which Ever User Clicks It There Profile Will Be Shown
router.get("/:id", function (req, res) {
    User.findById(req.params.id, function (err, foundUser) {
        if (err) {
            req.flash("error", "Something went wrong.");
            return res.redirect("/");
        }
        Campground.find().where('author.id').equals(foundUser._id).exec(function (err, campgrounds) {
            if (err) {
                req.flash("error", "Something went wrong.");
                return res.redirect("/");
            }
            res.render("users/show", { user: foundUser, campgrounds: campgrounds, page: 'profile' });
        });
    });
});

//----------------------------------------------------------------------------//
//-------------------------------Edit User Profile Form-----------------------//
//----------------------------------------------------------------------------//

// router.get("/:id/edit", middleware.checkUserOwnership, function (req, res) {
//     User.findById(req.params.id, function (err, foundUser) {
//         if (err || !foundUser) {
//             req.flash("error", "Specificed User not found!");
//             res.redirect("back");
//         }
//         else {
//             res.render("users/edit", { user: foundUser });
//         }
//     });
// });

//----------------------------------------------------------------------------//
//---------------------------------User Update Route--------------------------//
//----------------------------------------------------------------------------//
router.put("/:id", upload.single("avatar"), function (req, res) {
    cloudinary.uploader.upload(req.file.path, function (result) {
        if (req.file.path) {
            // add cloudinary url for the image to the campground object under image property
            req.body.avatar = result.secure_url;
        }
        //Data Object Which Contain New Data 
        var newData = { avatar: req.body.avatar, fullName: req.body.fullName, bio: req.body.bio, email: req.body.email, username: req.body.username };
        
        User.findByIdAndUpdate(req.params.id, newData, {new: true}, function (err, user) {
            
            //Any errors 
            if (err || !user) {
                req.flash("error", "Invalid User");
                res.redirect("back");
            }
            
            //Updates Campground Owners Name To Match The New One
            Campground.update({"author.id": user._id}, {$set: {"author.username": user.username}}, function(err, campground){
                if(err){
                    console.log(campground.author._id);
                }
            });
            
            //Updates Comment Owners Name To Match New One    
            Comment.update({"author.id": user._id}, {$set: {"author.username": user.username}}, function(err, Comment){
                if(err){
                    console.log(Comment.author._id);
                
                //Profile Update Conformation
                } else {
                    req.flash("success", "Profile updated");
                    res.redirect("/users/" + user._id);
                }
            });
        }); //End Of Find By Id And Update Function
    }); //End Of Cloudinary Function
}); //End Of Put Function

//----------------------------------------------------------------------------//
//-------------------------------Destory User Route---------------------------//
//----------------------------------------------------------------------------//

router.delete("/:id", middleware.checkUserOwnership, function (req, res) {
    User.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            //Any Errors

            //Flash Message
            req.flash("error", "Something Has Gone Wrong");

            //Takes The User Back To The Profile
            res.render('back');
        } else {
            //No Errors Then

            //Flash Message
            req.flash("success", "Your Account Has Been Successfully Deleted");

            //Redirect
            res.redirect("/campgrounds");
        }
    });
});

//----------------------------------------------------------------------------//
//---------------------------------Exports Data-------------------------------//
//----------------------------------------------------------------------------//
module.exports = router;
