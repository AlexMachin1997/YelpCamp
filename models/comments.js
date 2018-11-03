//Requires Mongoose
var mongoose = require("mongoose");

//Defining Collection Schema
var commentSchema = mongoose.Schema({

    //Text Content
    text: String,

    //Logs Creation Date
    createdAt: { type: Date, default: Date.now },

    //Assigns The Comment With The Current User Logged In
    author: {

        //Stores There ID
        id: {
            
            type: mongoose.Schema.Types.ObjectId,

            //model being refered to 
            ref: "User"
        },
        
        //Username
        username: String,
        
        //Users Avatar
        avatar: String
    }
});

//Exprts The Data And Gets Importeded To The App.js
module.exports = mongoose.model("Comment", commentSchema);
