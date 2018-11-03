var mongoose = require("mongoose"),
   passportLocalMongoose = require("passport-local-mongoose"),
   Campground = require('./campground'),
   Comment = require('./comments');

var UserSchema = new mongoose.Schema({

   //Username Propery
   username: {
      type: String,
      required: true,
      unique: true,
      min: 5,
      max: 15
   },

   //Password Propery
   password: {
      type: String,
      required: true,
      min: 5,
      max: 15
   },

   //Avatar Propery
   avatar: {
      type: String,
      required: true,
   },

   //Full Name Propery
   fullName: {
      type: String,
      required: true,
      min: 10,
      max: 20
   },

   //Bio Propery
   bio: {
      type: String,
      required: false,
   },

   //Email Propery
   email: {
      type: String,
      required: true,
      unique: true
   },

   //Creation Date Propery           
   createdAt: {
      type: Date,
      default: Date.now
   },

   //Admin Field Propery - ACCESS CODE IS REQUIRED
   isAdmin: {
      type: Boolean,
      default: false
   },
   
   //Reset Password Token Propery
   resetPasswordToken: String,
   
   //Reset Password Token Expiration Date 
   resetPasswordExpires: Date
});


// pre-hook middleware to delete all user's posts and comments from db when user is deleted
UserSchema.pre('remove', async function(next) {
  try {
      await Campground.remove({ 'author.id': this._id });
      await Comment.remove({ 'author.id': this._id });
      next();
  } catch (err) {
      console.log(err);
  }
});

UserSchema.plugin(passportLocalMongoose);

//Exports The Data And Imports It To The App.js
module.exports = mongoose.model("User", UserSchema);
