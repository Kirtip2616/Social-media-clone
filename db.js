// importing all the required classes/libs
const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const objectID=mongoose.objectID;

// create schema. Mongo is schemaless but still we are giving it a schema here
const user=new Schema({
    name:String,
    email:{type:String, unique:true},
    password:String,
    bio: { type: String, default: "" },
    profilePicture: { type: String, default: "" },
    followers: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    createdAt: { type: Date, default: Date.now }
})


const post = new Schema({
  caption: String,
  imageUrl: String,
  userid:  { type: Schema.Types.ObjectId, ref: 'users' },
  likes: [{ type: Schema.Types.ObjectId, ref: 'users' }],
  comments: [{
    userid: { type: Schema.Types.ObjectId, ref: 'users' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

const story = new Schema({
  caption: String,
  imageUrl: String,
  backgroundColor: String,
  textColor: String,
  userid: { type: Schema.Types.ObjectId, ref: 'users' },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24 hours
});
// here "users": means put the data in users collection that was created in mgdbcompass
// and user: refers to the schema created here
const UserModel=mongoose.model("users",user);
const PostModel=mongoose.model("posts",post);
const StoryModel = mongoose.model("stories", story);

// this helps us to export this whole code to different files in the directory
module.exports={
    UserModel,
    PostModel,
    StoryModel
}
