//----------------------------------------------------------------------------//
//--------------------------Dependencies For Route----------------------------//
//----------------------------------------------------------------------------//

var express = require("express"),

    // merge paramrs allows values like :id to be passed to the router which exports the module at the end

    router = express.Router({ mergeParams: true });

var Campground = require("../models/campground"),
    Comment = require("../models/comments");

var middleware = require("../middleware");


//----------------------------------------------------------------------------//
//----------------------------Posts The New Comment---------------------------//
//----------------------------------------------------------------------------//

router.post("/", middleware.isLoggedIn, function (req, res) {

    //lookup campground using ID
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            //Logs Error`
            console.log(err);

            //Redirects
            res.redirect("/campgrounds");
        }
        else {

            //Creating Comment
            //requests input from the input form
            //posts comment using .create()
            Comment.create(req.body.comment, function (err, comment) {

                //If There Is A Problem The Message Below Will Be Displayed - This Will Rarely Happen
                if (err) {
                    req.flash("error", "Thats Not Right :/, Please Contact Tech Support Or Try Again Later");

                    //Logs The Error
                    console.log(err);
                }
                else {


                    //req.user - guarntees the user is going to be looged allow for there id or username to be requested   

                    //add username and id to comment
                    comment.author.id = req.user._id; //Gets ID
                    comment.author.username = req.user.username; //Gets Username

                    //Saves Comment
                    comment.save();

                    //Adds The Comment To The Database
                    campground.comments.push(comment._id);

                    //Saves Campground
                    campground.save();

                    //Logs Comment - Debugging Purposes
                    console.log(comment);

                    //Success To Show Your Message Has Been Added
                    req.flash("success", "Your Comment Has Been Added");

                    //Redirects User Back To The Campground 
                    res.redirect('/campgrounds/' + campground._id);
                }
            });
        }
    });
});


//----------------------------------------------------------------------------//
//--------------------------------Edit The Comment ---------------------------//
//----------------------------------------------------------------------------//

router.get("/:comment_id/edit", middleware.checkCommentOwnership, function (req, res) {
    Comment.findById(req.params.comment_id, function (err, foundComment) {
        if (err) {
            //redirects
            res.redirect("back");
        }
        else {
            //Displays Comment On The Campground It Got Added To.
            res.render("comments/edit", { campground_id: req.params.id, comment: foundComment });
        }
    });
});


//----------------------------------------------------------------------------//
//-----------------------------Comment Update Route---------------------------//
//----------------------------------------------------------------------------//

router.put("/:comment_id", middleware.checkCommentOwnership, function (req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, updatedComment) {
        if (err) {
            //Logs Error
            console.log(err);

            //Redirects
            res.redirect("back");
        }
        else {
            //Success Message
            req.flash("success", "Your Comment Has Successfully Been Updated");

            //Redurects
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});


//----------------------------------------------------------------------------//
//----------------------------Destory Comment Route---------------------------//
//----------------------------------------------------------------------------//

router.delete("/:comment_id", middleware.checkCommentOwnership, function (req, res) {
    //Finds Comment By ID And Removes It
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {

        //Any Problems
        if (err) {

            //If The User Cant Delete The Comment   
            req.flash("error", "Looks Like Something Went Wrong When The Comment Was About To Be Deleted");

            //Directs Them Back
            res.redirect("back");

        }
        else {

            //Conformation Message   
            req.flash("success", "Comment Successfully Deleted");

            //Goes Back To The Campground
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//----------------------------------------------------------------------------//
//---------------------------------Exports Data-------------------------------//
//----------------------------------------------------------------------------//

module.exports = router;
