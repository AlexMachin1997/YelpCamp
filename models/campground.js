//Dependencies For Schema
var mongoose = require("mongoose");

//Schema Setup - Defines Properties
var campgroundSchema = new mongoose.Schema({

    //Name Of Campgound
    name: {
        type: String,
        required: true,
    },

    //Image For Campground
    image: {
        type: String,
        required: true,
    },

    //Campground Description
    description: {
        type: String,
        required: true,
    },

    //Campground Price
    price: {
        type: String,
        required: true,
    },

    //Google Maps + Geocode Data

    //Location - Lat + Lng = Location
    location: {
        type: String,
        required: true,
    },
    
        //latitude
        lat: {
            type: Number,
            required: true,
        },
    
        //Longitude
        lng: {
            type: Number,
            required: true,
        },


    //Log Campground Creation
    createdAt: {
        type: Date,
        default: Date.now
    },


    //Associates The Campground With The Current User Which Is Logged In
    author: {

        //Gets There ID
        id: {
            type: mongoose.Schema.Types.ObjectId,

            //model being refered to 
            ref: "User"
        },

        //Displays It As A Username Aftering Find The User ID    
        username: String
    },


    //Associates The Comment With The Current User Which Is Logged In
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,

            //model being refered to 
            ref: "Comment"
        }
    ]
});

//Exports The Schema, Then Its Imported Into The App.js
module.exports = mongoose.model("Campground", campgroundSchema);
