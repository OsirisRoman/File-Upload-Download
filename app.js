const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const fs = require("fs");

const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorControler = require("./controllers/error");

const mongoose = require("mongoose");
const User = require("./models/user");

require("dotenv").config();
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_DATABASE = process.env.MONGO_DATABASE;

const MONGODB_URI = `mongodb+srv://${encodeURIComponent(
  MONGO_USER
)}:${encodeURIComponent(
  MONGO_PASSWORD
)}@cluster0.7jlvx.mongodb.net/${MONGO_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

const csfrProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now().toString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set("view engine", "ejs");
app.set("views", "views");

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);

app.use(helmet());
app.use(compression());
app.use(morgan("combined", { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

//session is used as a middleware because it is used
//on every user request.
//"secret": parameter is the encryption phrase
//"resave": tells the server to save the session to
//the session store, even if the session was never
//modified during the request, in this case false
//means that the session will be saved just when it
//became modified.
//"saveUninitialized": Forces a session that is
//"uninitialized" to be saved to the store. A session
//is uninitialized when it is new but not modified.
//Choosing false is useful for implementing login
//sessions, reducing server storage usage, or complying
//with laws that require permission before setting a cookie
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store,
  })
);

app.use(csfrProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  // throw new Error('dummy error');
  if (!req.session.user) {
    return next();
  }
  const userID = req.session.user;
  User.findById(userID)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
});

app.use("/admin", adminRoutes);
app.use(publicRoutes);
app.use(authRoutes);

app.get("/500", errorControler.get500);

app.use(errorControler.get404);

app.use((err, req, res, next) => {
  // res.redirect('/500');
  res.status(500).render("500ServerError", {
    pageTitle: "Error!",
    path: "",
  });
});

const PORT = process.env.PORT || 3000;

//Replace the following url connection by your own connection.
//Try to follow the specified format.
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch(err => console.log(err));
