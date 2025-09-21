// importing all the required classes/libs
const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const objectID=mongoose.objectID;

// create schema. Mongo is schemaless but still we are giving it a schema here
const user=new Schema({
    name:String,
    email:{type:String, unique:true},
    password:String
})


const post = new Schema({
  caption: String,
  imageUrl: String,
  userid: String,
  createdAt: { type: Date, default: Date.now },
});
// here "users": means put the data in users collection that was created in mgcompass
// and user: refers to the schema created here
const UserModel=mongoose.model("users",user);
const PostModel=mongoose.model("posts",post);

// this helps us to export this whole code to different files in the directory
module.exports={
    UserModel,
    PostModel
}
