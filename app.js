const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const errorControler = require('./controllers/error');

const mongoose = require('mongoose');
const User = require('./models/user');

const MONGODB_URI = `mongodb+srv://${encodeURIComponent(
  'Osiris'
)}:${encodeURIComponent(
  '1724771645'
)}@cluster0.7jlvx.mongodb.net/shop?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
});

const csfrProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

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
    secret: 'my secret',
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

app.use('/admin', adminRoutes);
app.use(publicRoutes);
app.use(authRoutes);

app.get('/500', errorControler.get500);

app.use(errorControler.get404);

app.use((err, req, res, next) => {
  // res.redirect('/500');
  res.status(500).render('500ServerError', {
    pageTitle: 'Error!',
    path: '',
  });
});

const PORT = 3000;

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
