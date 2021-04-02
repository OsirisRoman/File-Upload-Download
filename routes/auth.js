const express = require('express');
const { body, param } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

const authController = require('../controllers/auth');

const router = express.Router();

const loginEmailValidation = body('email')
  .isEmail()
  .withMessage('Email is not valid')
  .normalizeEmail()
  .bail()
  .custom((value, { req }) => {
    return User.findOne({ email: value })
      .then(userDoc => {
        if (!userDoc) {
          return Promise.reject('Invalid email or password');
        }
        return bcrypt
          .compare(req.body.password, userDoc.password)
          .then(doMatch => {
            if (!doMatch) {
              return Promise.reject('Invalid email or password');
            } else {
              req.session.user = userDoc._id;
            }
          })
          .catch(err => {
            //console.log(err);
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });
      })
      .catch(err => {
        //console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });

const usernameValidation = body('name')
  .isLength({ min: 1 })
  .withMessage("User name can't be empty.");

const emailNonExistanceValidation = body('email')
  .isEmail()
  .withMessage('Email is not valid')
  .normalizeEmail()
  .bail()
  .custom((value, { req }) => {
    return User.findOne({ email: value })
      .then(userDoc => {
        if (userDoc) {
          return Promise.reject(
            'This email is already in use, please pickup a different one'
          );
        }
      })
      .catch(err => {
        //console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });

const emailExistanceValidation = body('email')
  .isEmail()
  .withMessage('Email is not valid')
  .normalizeEmail()
  .bail()
  .custom((value, { req }) => {
    return User.findOne({ email: value })
      .then(userDoc => {
        if (!userDoc) {
          return Promise.reject('The email has not been registered yet');
        } else {
          req.targetUser = userDoc;
        }
      })
      .catch(err => {
        //console.log(err);
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });

const passwordValidation = body('password')
  .isLength({ min: 5 })
  .withMessage('Password is too short/insecure');

const confirmedPasswordValidation = body('confirmedPassword').custom(
  (value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password and Confirmed Password must be equal.');
    }
    return true;
  }
);

const tokenValidation = param('token').custom((value, { req }) => {
  return User.findOne({
    resetToken: value,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then(userDoc => {
      if (!userDoc) {
        return Promise.reject(
          'The unique link has expired, please generate a new one.'
        );
      } else {
        req.targetUser = userDoc;
      }
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
});

router.get('/login', authController.getLogin);

router.post(
  '/login',
  //checks email to be a valid email,
  //checks email existance and
  //checks email-password match
  loginEmailValidation,
  authController.postLogin
);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post(
  '/signup',
  //checks non empty username
  usernameValidation,
  //checks email to be a valid email,
  //checks email non-existance
  emailNonExistanceValidation,
  //checks password length > 5
  passwordValidation,
  //checks password-confirmedPassword equality
  confirmedPasswordValidation,
  //passwordAndConfirmPasswordValidation,
  authController.postSignup
);

router.get('/reset-password', authController.getResetPassword);

router.post(
  '/reset-password',
  //checks email to be a valid email
  emailExistanceValidation,
  authController.postResetPassword
);

router.get(
  '/update-password/:token',
  //checks token existance and expiration.
  tokenValidation,
  authController.getUpdatePassword
);

router.post(
  '/update-password',
  //checks password length > 5
  passwordValidation,
  //checks password-confirmedPassword equality
  confirmedPasswordValidation,
  //passwordAndConfirmPasswordValidation,
  authController.postUpdatePassword
);

module.exports = router;
