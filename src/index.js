const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const session = require("express-session");

const session_secret = "blogs";

const app = express();
app.use(express.json()); // added body key to req
app.set('trust proxy',1);
app.use(cors({
  credentials: true,
  origin: "https://localhost:3000"
}));

app.use(
  session({
    secret: session_secret,
    cookie: { maxAge: 1*60*60*1000, sameSite: 'none', secure: true },
    resave: true,
    saveUninitialized: true
  })
); // adds a property called session to req*/

// connect - must edit
const db = mongoose.createConnection("mongodb://localhost:27017/blogs", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// schemas
const userSchema = new mongoose.Schema({
    userName: String,
    password: String,
    isAdmin: Boolean
});

const blogSchema = new mongoose.Schema({
    title: String,
    content: String,
    author: String,
    userId: mongoose.Schema.Types.ObjectId
});

// models
const userModel = db.model("user", userSchema);
const blogModel = db.model("blogs", blogSchema);

// backend apis
const isNullOrUndefined = (val) => val === null || val === undefined;
const SALT = 5;

app.post("/signup", async (req, res) => {
    const { userName, password } = req.body;
    const isAdmin = false;
    if(userName.trim()==="" || userName.trim()===null || userName.trim()===undefined)
      res.sendStatus(400);
    if(password.trim()==="" || password.trim()===null || password.trim()===undefined)
      res.sendStatus(400);
    const existingUser = await userModel.findOne({ userName });
    if (isNullOrUndefined(existingUser)) {
        // we should allow signup
        const hashedPwd = bcrypt.hashSync(password, SALT);
        const newUser = new userModel({ userName, password: hashedPwd, isAdmin });

        await newUser.save();
        req.session.userId = newUser._id;
        res.status(201).send({ success: "Signed up" });
    } else {
        res.status(400).send({
        err: `UserName ${userName} already exists. Please choose another.`,
        });
    }
});

app.post("/login", async (req, res) => {
    const { userName, password } = req.body;
    const existingUser = await userModel.findOne({
      userName,
    });
  
    if (isNullOrUndefined(existingUser)) {
      res.status(401).send({ err: "UserName does not exist." });
    } else {
      const hashedPwd = existingUser.password;
      if (bcrypt.compareSync(password, hashedPwd)) {
        req.session.userId = existingUser._id;
        console.log('Session saved with', req.session);
        res.status(200).send({ success: "Logged in" });
      } else {
        res.status(401).send({ err: "Password is incorrect." });
      }
    }
});

const AuthMiddleware = async (req, res, next) => {
    console.log('Session', req.session);
  // added user key to req
  if (isNullOrUndefined(req.session) || isNullOrUndefined(req.session.userId) ) {
    res.status(401).send({ err: "Not logged in" });
  } else {
    next();
  }
};

//Get All GET All blog posts (only the titles and author)
app.get("/blogposts", AuthMiddleware, async (req, res) => {
    const allposts = await blogModel.find().select({
        title: true,
        author: true,
        _id: false
    });
    res.send(allposts);
});

//GET details of the single blog post (title + author + content) 
app.get("/blogpost/:bid", AuthMiddleware, async (req, res) => {
  try{
    const blogpost = await blogModel.findOne({ _id: req.params.bid }).select({
        title: true,
        author: true,
        content: true,
        _id: false
    });
    if(blogpost === null){
        res.sendStatus(404);
    }
    else{
      res.status(200).send(blogpost);
    }
  }catch(e){
    res.sendStatus(404);
  }
});

//Create a new blog post - server receives title and content
app.post("/createblog", AuthMiddleware, async (req, res) => {
    const blog = req.body;
    const user = await userModel.findOne({ _id: req.session.userId });
    blog.author = user.userName;
    blog.userId = req.session.userId;
    const newblog = new blogModel(blog);
    await newblog.save();
    res.status(201).send(newblog);
});

//Update an existing blog post
app.put("/blogpost/:bid", AuthMiddleware, async (req, res) => {
  const  blog  = req.body;
  const blogId = req.params.bid;

  try {
    const blogpost = await blogModel.findOne({ _id: blogId, userId: req.session.userId });
    if (isNullOrUndefined(blogpost)) {
      res.sendStatus(401);
    } else {
      if(blog.title)
        blogpost.title = blog.title;
      if(blog.content)
        blogpost.content = blog.content;
     
      await blogpost.save();
      res.send(blogpost);
    }
  } catch (e) {
    res.sendStatus(404);
  }
});

// Delete an existing blog post
app.delete("/blogpost/:bid", AuthMiddleware, async (req, res) => {
  const bid = req.params.bid;

  try {
    const blogpost = await blogModel.findOne({ _id: bid, userId: req.session.userId });
    const admin = await userModel.findOne({ _id: req.session.userId });
    if (isNullOrUndefined(blogpost) && admin.isAdmin === false) {
      res.sendStatus(401);
    }
    else {
        await blogModel.deleteOne({ _id: bid});
        res.sendStatus(200);
    }
  } catch (e) {
    res.sendStatus(404);
  }
});

//Get the filtered list of posts (filter by title)
app.get("/blogsearch", AuthMiddleware, async (req, res) => {
    const search_title = req.body.title;
    const reg = new RegExp(search_title,'i');
    const titles = await blogModel.find({ title: { $regex: reg }});
    res.send(titles);
});

app.get("/logout", (req, res)=> {
    if(!isNullOrUndefined(req.session)) {
        // destroy the session
        req.session.destroy(() => {
            res.sendStatus(200);
        });

    } else {
        res.sendStatus(200);
    }
});

app.get("/",(req,res)=>{
  res.send("blogpost server works");
})

//app.listen(process.env.PORT);
app.listen(9999);
