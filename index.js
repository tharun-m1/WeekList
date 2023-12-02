const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Schema
const User = mongoose.model("User", {
  fullName: String,
  email: String,
  password: String,
  age: Number,
  gender: String,
  mobile: String,
});
// Schema
const taskListofUser = mongoose.model("taskListofUser", {
  userId: String,
  taskInfo: {
    weekListNo: Number,
    isCompleted: Boolean,
    createdTime: Date,
    descriptions: [{ task: String, isCompleted: Boolean }],
  },
});
// middleware
const isLoggedIn = (req, res, next) => {
  try {
    const jwToken = req.headers.authorization;
    // console.log("JWToken: ", jwToken);
    const user = jwt.verify(jwToken, process.env.SECRET_KEY);
    req.user = user;
    next();
  } catch (error) {
    // console.log(error);
    res.json({
      Status: "Failed",
      message: "You are not LoggedIn",
    });
  }
};

// create weekList
app.post("/create-weeklist", isLoggedIn, async (req, res) => {
  try {
    const { userId, taskInfo } = req.body;
    const user = await User.findOne({ _id: userId });

    if (user === null) {
      res.json({
        status: "Failed",
        message: "User doesn't exist",
      });
    } else {
      taskInfo.createdTime = new Date();

      taskListofUser.find({ userId }).then(async (weeklists) => {
        if (weeklists.length < 2) {
          await taskListofUser.create({ userId, taskInfo });
          res.json({
            staus: "Success",
            message: "weekList added successfully.",
          });
        } else {
          res.json({
            status: "Failed",
            message: "limit Exceeded.",
          });
        }
      });
    }
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed",
      message: "Something went wrong",
    });
  }
});

// health
app.get("/health", async (req, res) => {
  const time = new Date().toLocaleString();
  try {
    await User.find({});
    res.json({
      serverName: "weekList",
      currentTime: time,
      status: "active",
    });
  } catch (error) {
    res.json({
      serverName: "weekList",
      currentTime: time,
      status: "Inactive",
    });
  }
});

// home
app.get("/", (req, res) => {
  res.json({
    status: "Success!!",
    message: "All good!",
  });
});
// for testing
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json({
      status: "Success!",
      data: users,
    });
  } catch (error) {
    console.log(error);
  }
});
// for tasks collection
app.get("/taskdb", isLoggedIn, async (req, res) => {
  try {
    const tasklist = await taskListofUser.find({});
    res.json({
      status: "Success!",
      data: tasklist,
    });
  } catch (error) {
    console.log(error);
  }
});
// signup
app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, age, gender, mobile } = req.body;
    const encryptedPassword = await bcrypt.hash(password, 10);
    await User.create({
      fullName,
      email,
      password: encryptedPassword,
      age,
      gender,
      mobile,
    });
    res.json({
      status: "Success!",
      message: "User created Successfully!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      status: "Failed...",
      message: "User is NOT created",
    });
  }
});

// login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log(req.body);
    if (user) {
      let passwordMatched = await bcrypt.compare(password, user.password);
      if (passwordMatched) {
        const jwToken = jwt.sign(user.toJSON(), process.env.SECRET_KEY, {
          expiresIn: 60 * 60,
        });
        res.json({
          status: "Success!",
          message: "LoggedIn Successfully!!",
          jwToken,
        });
      } else {
        res.json({
          status: "Failed...",
          message: "Incorrect Credentials.",
        });
      }
    } else {
      res.json({
        status: "Failed",
        message: "User doesn't Exist",
      });
    }
  } catch (error) {
    console.log(error);
  }
});
// listening
app.listen(process.env.PORT, () => {
  mongoose
    .connect(process.env.MONGODB_URL)
    .then(() =>
      console.log(`Server running at http://localhost:${process.env.PORT}`)
    )
    .catch((error) => console.log(error));
});
