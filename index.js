const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
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

const isLoggedIn = (req, res, next) => {
  try {
    const { jwToken } = req.headers;
    const user = jwt.verify(jwToken, process.env.SECRET_KEY);
    req.user = user;
    next();
  } catch (error) {
    res.json({
      Status: "Failed",
      message: "You are not LoggedIn",
    });
  }
};

// health
app.get("/health", (req, res) => {
  const time = new Date().toLocaleString();
  res.json({
    serverName: "weekList",
    currentTime: time,
    status: "active",
  });
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
          expiresIn: 30,
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
