require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('./handlers/error');
const authRoutes = require('./routes/auth');
const messagesRoutes = require('./routes/messages');
const userRoutes = require('./routes/user');
const { loginRequired, isCorrectUser } = require('./middleware/auth');
const db = require("./models");

const PORT = process.env.PORT || 8081;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);

app.use('/api/users/:id/messages', loginRequired, isCorrectUser, messagesRoutes);
app.get('/api/user/:id/messages/:message_id',  async function(req, res, next) {
  try {
    let foundMessage = await db.Message.findById(req.params.message_id)
      .populate({
        path: "comments",
        populate: { path: "user", select: "profileImage username" },
        options: {sort: { createdAt: 'desc'}}
      })
      .populate({
        path: "user",
        select: "profileImage username"
      })
    return res.status(200).json(foundMessage);
  } catch (err) {
    return next(err);
  }
});
app.get("/api/messages", loginRequired, async function(req, res, next) {
  try {
    let messages = await db.Message.find()
      .sort({ createdAt: "desc" })
      .populate("user", {
        username: true,
        profileImage: true
      })
    return res.status(200).json(messages);
  } catch (err) {
    return next(err);
  }
});

app.use('/api/user/:id', loginRequired, isCorrectUser, userRoutes);
app.get('/api/users/:id', loginRequired, async function(req, res, next) {
  try {
    let user = await db.User.findById(req.params.id, "-password").populate({
      path: "messages",
      options: { sort: { createdAt: "desc" } },
      populate: { path: "user", select: "profileImage username" }
    });

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

app.use(function(req, res, next){
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
})

app.use(errorHandler);

app.listen(PORT, function(){
  console.log(`Server is starting on port ${PORT}`);
});