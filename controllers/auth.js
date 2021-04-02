const User = require('../models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const getLogin = (req, res, next) => {
  if (req.session.isLoggedIn) {
    return res.redirect('/');
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login Page',
    errors: req.flash('error'),
    oldValues: undefined,
  });
};

const postLogin = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login Page',
      errors: errors.errors.map(error => ({
        param: error.param,
        msg: error.msg,
      })),
      oldValues: req.body,
    });
  }
  req.session.isLoggedIn = true;
  //req.session.user = req.userId;
  req.session.save(err => {
    if (err) {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
    res.redirect('/');
  });
};

const postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
    res.redirect('/login');
  });
};

const getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup Page',
    errors: req.flash('error'),
    oldValues: undefined,
  });
};

const postSignup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup Page',
      errors: errors.errors.map(error => ({
        param: error.param,
        msg: error.msg,
      })),
      oldValues: req.body,
    });
  }

  bcrypt
    .hash(req.body.password, 12)
    .then(hashedPassword => {
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        cart: [],
      });
      return user.save();
    })
    .then(() => res.redirect('/login'))
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

const getResetPassword = (req, res, next) => {
  res.render('auth/resetPassword', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errors: req.flash('error'),
    oldValues: undefined,
  });
};

const postResetPassword = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/resetPassword', {
      path: '/reset',
      pageTitle: 'Reset Password',
      errors: errors.errors.map(error => ({
        param: error.param,
        msg: error.msg,
      })),
      oldValues: req.body,
    });
  }
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      req.flash('error', 'An error occurred during the process, please retry');
      return res.redirect('/reset-password');
    }
    const token = buffer.toString('hex');
    req.targetUser.resetToken = token;
    req.targetUser.resetTokenExpiration = Date.now() + 30000;
    req.targetUser.save();
    //The following link must be sent to userDoc.email using any SMTP service.
    console.log(`http://localhost:3000/update-password/${token}`);
    res.redirect('/login');
  });
};

const getUpdatePassword = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/resetPassword', {
      path: '/Reset Password',
      pageTitle: 'Reset Password',
      errors: errors.errors.map(error => ({
        param: error.param,
        msg: error.msg,
      })),
      oldValues: undefined,
    });
  }
  res.render('auth/updatePassword', {
    path: '/updatePassword',
    pageTitle: 'Update Password',
    errors: req.flash('error'),
    userId: req.targetUser._id.toString(),
    oldValues: undefined,
  });
};

const postUpdatePassword = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/updatePassword', {
      path: '/updatePassword',
      pageTitle: 'Update Password',
      errors: errors.errors.map(error => ({
        param: error.param,
        msg: error.msg,
      })),
      userId: req.body.userId,
      oldValues: req.body,
    });
  }
  let user;
  User.findById(req.body.userId)
    .then(userDoc => {
      user = userDoc;
      return bcrypt.hash(req.body.password, 12);
    })
    .then(hashedPassword => {
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiration = undefined;
      user.save();
      res.redirect('/login');
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

module.exports = {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
  getResetPassword,
  postResetPassword,
  getUpdatePassword,
  postUpdatePassword,
};
