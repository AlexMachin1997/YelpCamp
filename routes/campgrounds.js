//----------------------------------------------------------------------------//
//--------------------------Dependencies For Route----------------------------//
//----------------------------------------------------------------------------//

var express = require("express"),
    router = express.Router(),
    Campground = require("../models/campground"),
    middleware = require("../middleware"),
    multer = require('multer'),
    NodeGeocoder = require('node-geocoder');


//Node Geocoder API Configuration
var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    formatter: null
};

var geocoder = NodeGeocoder(options);


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
//---------------------------------Index Route--------------------------------//
//----------------------------------------------------------------------------//
router.get("/", function (req, res) {
    var perPage = 4;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
        Campground.count().exec(function (err, count) {
            if (err) {
                console.log(err);
            }
            else {
                res.render("campgrounds/Index", {
                    page: 'featuredCamps',
                    campgrounds: allCampgrounds,
                    current: pageNumber,
                    pages: Math.ceil(count / perPage)
                });
            }
        });
    });
});


//----------------------------------------------------------------------------//
//---------------------------Creates New Campground---------------------------//
//----------------------------------------------------------------------------//

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function (req, res) {

    //Local Variables 

    // Requests The Name
    var name = req.body.name;

    // Requests The Image 
    var image = req.body.image ? req.body.image : "/images/temp.png";

    // Requests The Description  
    var desc = req.body.description;

    // Requests The Authors ID + Username
    var author = {
        id: req.user._id,
        username: req.user.username
    };

    // Requests The Price 
    var price = req.body.price;


    //Location Code - Geocode Package
    geocoder.geocode(req.body.location, function (err, data) {

        //Error Handling For Autocomplete API Requests

        //Error handling provided by google docs -https://developers.google.com/places/web-service/autocomplete 
        if (err || data.status === 'ZERO_RESULTS') {
            req.flash('error', 'Invalid address, try typing a new address');
            return res.redirect('back');
        }

        //Error handling provided by google docs -https://developers.google.com/places/web-service/autocomplete 
        if (err || data.status === 'REQUEST_DENIED') {
            req.flash('error', 'Something Is Wrong Your Request Was Denied');
            return res.redirect('back');
        }

        //Error handling provided by google docs -https://developers.google.com/places/web-service/autocomplete 
        if (err || data.status === 'OVER_QUERY_LIMIT') {
            req.flash('error', 'All Requests Used Up');
            return res.redirect('back');
        }

        //Credit To Ian For Fixing The Geocode Problem - https://www.udemy.com/the-web-developer-bootcamp/learn/v4/questions/2788856
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;


        //Reference: Zarko And Ian Helped Impliment the Image Upload - https://github.com/nax3t/image_upload_example

        cloudinary.uploader.upload(req.file.path, function (result) {

            //image variable needs to be here so the image can be stored and uploaded to cloudinary
            image = result.secure_url;


            //Captures All Objects And Stores Them
            var newCampground = { name: name, image: image, description: desc, author: author, price: price, location: location, lat: lat, lng: lng };

            // Create a new campground and save to DB by using the create method
            Campground.create(newCampground, function (err, newlyCreated) {
                if (err) {
                    //Logs Error
                    req.flash('error', err.message);

                    return res.redirect('back');

                }
                else {

                    //redirect back to campgrounds page

                    //Logs Error
                    console.log(newlyCreated);

                    //Flash Message 
                    req.flash("success", "Campground Added Successfully");

                    //Redirects Back To Featured Campgrounds Page
                    res.redirect("/campgrounds");
                }
            });
        });
    });
});

//----------------------------------------------------------------------------//
//-----------------------------New Campground Form----------------------------//
//----------------------------------------------------------------------------//


router.get("/new", middleware.isLoggedIn, function (req, res) {

    //Renders Form & Passes page variable in so it can be used in the 
    res.render("campgrounds/new", { page: 'newCamp' });
});

//----------------------------------------------------------------------------//
//--------------------SHOW ROUTE - Displays Specific Camp---------------------//
//----------------------------------------------------------------------------//

router.get("/:id", function (req, res) {

    //foundCampground - Data coming back from this find by id
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err) {

            //Logs Error
            console.log(err);

            //Flash Message
            req.flash("error", "Something Went Wrong");
        }
        else {
            //Renders Template And Generates Data Based On The Value Which Was Inputed
            res.render("campgrounds/show", { campground: foundCampground });
        }
    });
});


//----------------------------------------------------------------------------//
//---------------------------Edit Campground Route---------------------------//
//----------------------------------------------------------------------------//

router.get("/:id/edit", middleware.checkCampgroundOwnership, function (req, res) {

    //Gets Campground ID, but before it checks the checkCampground OwnerShip

    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {

            //Error Message
            req.flash("error", "Campground Not Found");

        }

        //Renders Edit Form, Also Passes In foundCampground To EJS Template
        res.render("campgrounds/edit", { campground: foundCampground, });
    });
});

//----------------------------------------------------------------------------//
//----------------------------Campground Update Route--------------------------//
//----------------------------------------------------------------------------//

router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function (req, res) {

    geocoder.geocode(req.body.campground.location, function (err, data) {

        //Error Handling For Autocomplete API Requests

        //Error handling provided by google docs -https://developers.google.com/places/web-service/autocomplete 
        if (err || data.status === 'ZERO_RESULTS') {
            req.flash('error', 'Invalid address, try typing a new address');
            return res.redirect('back');
        }

        //Error handling provided by google docs -https://developers.google.com/places/web-service/autocomplete 
        if (err || data.status === 'REQUEST_DENIED') {
            req.flash('error', 'Something Is Wrong Your Request Was Denied');
            return res.redirect('back');
        }

        //Error handling provided by google docs -https://developers.google.com/places/web-service/autocomplete 
        if (err || data.status === 'OVER_QUERY_LIMIT') {
            req.flash('error', 'All Requests Used Up');
            return res.redirect('back');
        }

        //Credit To Ian For Fixing The Geocode Problem - https://www.udemy.com/the-web-developer-bootcamp/learn/v4/questions/2788856
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;

        cloudinary.uploader.upload(req.file.path, function (result) {
            if (req.file.path) {
                // add cloudinary url for the image to the campground object under image property
                req.body.campground.image = result.secure_url;
            }

            var newData = { name: req.body.campground.name, image: req.body.campground.image, description: req.body.campground.description, price: req.body.campground.price, location: location, lat: lat, lng: lng };


            //Updated Data Object
            Campground.findByIdAndUpdate(req.params.id, { $set: newData }, function (err, campground) {
                if (err) {
                    //Flash Message
                    req.flash("error", err.message);

                    //Redirects Back
                    res.redirect("back");
                }
                else {
                    //Flash Message
                    req.flash("success", "Successfully Updated!");

                    //Redirects To Edited Campground
                    res.redirect("/campgrounds/" + campground._id);
                }
            }); //End Campground/findBoyIdAndUpdate
        }); //Ends Cloudinary Image Upload
    }); //Ends Geocoder()
}); //Ends Put Router

//----------------------------------------------------------------------------//
//---------------------------Destory Campground Route------------------------//
//----------------------------------------------------------------------------//

//
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
    Campground.findByIdAndRemove(req.params.id, function (err) {
        if (err) {

            //Redirects To Root Featured Camps 
            res.redirect("/campgrounds");
        }
        else {

            //Redirects To Root Featured Camps 
            res.redirect("/campgrounds");
        }
    });
});


//----------------------------------------------------------------------------//
//--------------------------------Exports Data--------------------------------//
//----------------------------------------------------------------------------//

module.exports = router;