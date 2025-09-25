const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config(); // Load .env variables

const { UserModel, PostModel,StoryModel } = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

const multer = require("multer");
const path = require("path");

const sharp = require('sharp');
const fs = require('fs');

app.use(cors());
app.use(express.json());



// SIGNUP 
app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  await UserModel.create({
    email,
    password: hashedPassword,
    name,
  });

  res.json({ message: "Account created successfully" });
});

//  SIGNIN 
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET);
    res.json({ token });
  } else {
    res.status(403).json({ message: "Invalid credentials" });
  }
});



// AUTH MIDDLEWARE
function auth(req, res, next) {
  try {
    const token = req.headers.token;
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.userid = decodedData.id;
    next();
  } catch (err) {
    res.status(403).json({ message: "Incorrect credentials" });
  }
}



// CREATE POST 
app.post("/post", auth, async (req, res) => {
  const { caption, imageUrl } = req.body;
  const userid = req.userid;

  await PostModel.create({ caption, imageUrl, userid });
  res.json({ message: "Post created successfully" });
});

// GET POSTS 
app.get("/posts", auth, async (req, res) => {
 const posts = await PostModel.find({})
    .populate("userid", "name email") // This should now work correctly
    .sort({ createdAt: -1 }); // Add sorting to show newest posts first
  res.json({ posts });
});




// DELETE POST 
app.delete("/posts/:id", auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userid;
    
    // Find the post
    const post = await PostModel.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    // Check if the user owns the post
    if (post.userid.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    
    // Delete the post
    await PostModel.findByIdAndDelete(postId);
    
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// File upload endpoint
app.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const ratio = req.body.ratio || 'square';
    const filePath = req.file.path;
    const fileName = req.file.filename;
    const croppedFileName = `cropped_${fileName}`;
    const croppedFilePath = `uploads/${croppedFileName}`;
    
    // Crop image based on selected ratio
    if (ratio === 'square') {
      // Crop to square (1:1)
      await sharp(filePath)
        .resize(1080, 1080, {
          fit: 'cover',
          position: 'center'
        })
        .toFile(croppedFilePath);
    } else {
      // Crop to portrait (4:5)
      await sharp(filePath)
        .resize(1080, 1350, {
          fit: 'cover',
          position: 'center'
        })
        .toFile(croppedFilePath);
    }
    
    // Delete the original uploaded file
    fs.unlinkSync(filePath);
    
    // Return the URL of the cropped file
    res.json({ 
      imageUrl: `http://localhost:3000/uploads/${croppedFileName}` 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error processing image" });
  }
});
// GET USER PROFILE
app.get("/profile", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.userid).select("-password");
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// UPDATE USER PROFILE
app.put("/profile", auth, upload.single("profilePicture"), async (req, res) => {
  try {
    const { name, bio } = req.body;
    let profilePicture = "";

    if (req.file) {
      profilePicture = `http://localhost:3000/uploads/${req.file.filename}`;
    }

    const updateData = { name, bio };
    if (profilePicture) {
      updateData.profilePicture = profilePicture;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.userid,
      updateData,
      { new: true }
    ).select("-password");

    res.json({ 
      message: "Profile updated successfully", 
      user: updatedUser 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// DELETE PROFILE PICTURE
app.delete("/profile/picture", auth, async (req, res) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.userid,
      { profilePicture: "" },
      { new: true }
    ).select("-password");

    res.json({ 
      message: "Profile picture removed successfully", 
      user: updatedUser 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove profile picture" });
  }
});

// GET USER'S POSTS
app.get("/profile/posts", auth, async (req, res) => {
  try {
    const posts = await PostModel.find({ userid: req.userid })
      .populate("userid", "name email profilePicture")
      .sort({ createdAt: -1 });
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
});
// CREATE STORY
app.post("/story", auth, upload.single("image"), async (req, res) => {
  try {
    const { caption, backgroundColor, textColor } = req.body;
    const userid = req.userid;
    let imageUrl = "";

    if (req.file) {
      imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    }

    await StoryModel.create({ 
      caption, 
      imageUrl, 
      backgroundColor: backgroundColor || '#000000',
      textColor: textColor || '#ffffff',
      userid 
    });

    res.json({ message: "Story created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create story" });
  }
});

// GET STORIES
app.get("/stories", auth, async (req, res) => {
  try {
    const stories = await StoryModel.find({})
      .populate("userid", "name email")
      .sort({ createdAt: -1 });
    res.json({ stories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
});

// GET MY STORIES
app.get("/stories/me", auth, async (req, res) => {
  try {
    const stories = await StoryModel.find({ userid: req.userid })
      .sort({ createdAt: -1 });
    res.json({ stories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your stories" });
  }
});
// FOLLOW/UNFOLLOW USER
app.post("/follow/:userId", auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.userid;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const targetUser = await UserModel.findById(targetUserId);
    const currentUser = await UserModel.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await UserModel.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId }
      });
      await UserModel.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId }
      });
      res.json({ message: "Unfollowed successfully", action: "unfollow" });
    } else {
      // Follow
      await UserModel.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId }
      });
      await UserModel.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId }
      });
      res.json({ message: "Followed successfully", action: "follow" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to follow/unfollow user" });
  }
});

// GET FOLLOWING STATUS
app.get("/follow/status/:userId", auth, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.userid;

    const currentUser = await UserModel.findById(currentUserId);
    const isFollowing = currentUser.following.includes(targetUserId);

    res.json({ isFollowing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get follow status" });
  }
});

// GET USER SUGGESTIONS (Users to follow)
app.get("/users/suggestions", auth, async (req, res) => {
  try {
    const currentUserId = req.userid;
    
    // Get users that current user is not following (excluding themselves)
    const users = await UserModel.find({
      _id: { $ne: currentUserId, $nin: await UserModel.findById(currentUserId).select('following') }
    })
    .select('name profilePicture bio followers')
    .limit(10);

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get user suggestions" });
  }
});

// GET FOLLOWERS LIST
app.get("/users/followers", auth, async (req, res) => {
  try {
    const currentUserId = req.userid;
    
    const user = await UserModel.findById(currentUserId)
      .populate('followers', 'name profilePicture bio')
      .select('followers');

    res.json({ followers: user.followers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get followers" });
  }
});

// GET FOLLOWING LIST
app.get("/users/following", auth, async (req, res) => {
  try {
    const currentUserId = req.userid;
    
    const user = await UserModel.findById(currentUserId)
      .populate('following', 'name profilePicture bio')
      .select('following');

    res.json({ following: user.following });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get following list" });
  }
});

// UPDATE FEED TO SHOW FOLLOWED USERS' POSTS
app.get("/posts/following", auth, async (req, res) => {
  try {
    const currentUserId = req.userid;
    
    const currentUser = await UserModel.findById(currentUserId);
    const followingIds = currentUser.following;

    // Get posts from followed users + current user's own posts
    const posts = await PostModel.find({
      userid: { $in: [...followingIds, currentUserId] }
    })
    .populate("userid", "name email profilePicture")
    .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});
app.listen(process.env.PORT || 3000, () =>
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`)
);