const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config(); // Load .env variables

const { UserModel, PostModel } = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

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
  const posts = await PostModel.find({}).populate("userid", "name email");
  res.json({ posts });
});


app.listen(process.env.PORT || 3000, () =>
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`)
);
