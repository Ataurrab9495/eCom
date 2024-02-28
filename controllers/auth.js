const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user.mongoose');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');



let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mohammedataurrab@gmail.com',
    pass: 'eswq pdri wqgs ywjx'
  }
})

exports.getLogin = (req, res, next) => {
  /* const isLoggedIn = req.get('Cookie').split(';')[1].trim().split('=')[1]; */
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};


exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage: message,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    validationErrors: []
  });
};


exports.PostLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const loginError = validationResult(req);

  if (!loginError.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: loginError.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: loginError.array()
    });
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          errorMessage: 'Invalid email or password.',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        });
      }

      bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {   // by adding this line i confirmed that once my session is saved then only i will redirect my home page
              console.log(err);
              res.redirect('/');
            });
          }
          return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: 'Invalid email or password.',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        })

    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);  // this will skip all the middleware and will go to the error middleware
  })
}

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      },
      validationErrors: errors.array()
    });
  }

  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc) {
        req.flash('error', 'E-Mail exists already, please pick a different one.');
        return res.redirect('/signup');
      }
      return bcrypt.hash(password, 12)
        .then(hashedpassword => {
          const user = new User({
            email: email,
            password: hashedpassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(result => {
          res.redirect('/login');
          return transporter.sendMail({
            to: email,
            from: 'mohammedataurrab@gmail.com',
            subject: 'Signup-Succeeded!',
            html: '<h1>You have successfully signed up!</h1>'
          })
        })
        .catch(err => {
          console.log(err);
        })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);  // this will skip all the middleware and will go to the error middleware
  })
};



exports.PostLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};


exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};


// This route handles the submission of a password reset request.
exports.postReset = (req, res, next) => {
  // Generate a random token using crypto for password reset
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      // Handle any error during token generation
      console.log(err);
      return res.redirect('/reset');
    }

    // Convert the buffer to a hexadecimal string to use as the reset token
    const token = buffer.toString('hex');

    // Find a user with the provided email in the database
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          // If no user with the provided email is found, redirect to reset page with an error message
          req.flash('error', 'No account with that email found.');
          return res.redirect('/reset');
        }

        // Set the generated token and its expiration time for the user
        user.resetToken = token,
          user.resetTokenExpiration = Date.now() + 3600000; // Token expires in 1 hour

        // Save the user with the new reset token
        return user.save();
      })
      .then(result => {
        // Redirect to the home page after successfully initiating the password reset process
        res.redirect('/');

        // Send a password reset email to the user
        transporter.sendMail({
          to: req.body.email,
          from: 'mohammedataurrab@gmail.com',
          subject: 'Password reset',
          html: `
          <p>You requested a password reset.</p>
          <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
        `
        })
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);  // this will skip all the middleware and will go to the error middleware
    })
  })
};


// Controller function to render the "New Password" page
exports.getNewPassword = (req, res, next) => {
  // Extract the token parameter from the request URL
  const token = req.params.token;

  // Find a user with the provided reset token and a valid expiration date
  /* gt: greater than = it checks whether the given value is greater than database value.*/
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then(user => {
      // Check if there are any flash error messages
      let message = req.flash('error');

      // If there is an error message, assign it to the 'message' variable, otherwise set it to null
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      // Render the "New Password" page with relevant data
      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        passwordToken: token,
        userId: user._id.toString() // Convert the user ID to a string for rendering
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);  // this will skip all the middleware and will go to the error middleware
  })
};


exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId
  })
    .then(user => {
      if (!user) {
        // User not found, handle the error
        req.flash('error', 'Invalid or expired reset token. Please try again.');
        return res.redirect('/password-reset'); // Redirect to the password reset page
      }
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedpassword => {
      resetUser.password = hashedpassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);  // this will skip all the middleware and will go to the error middleware
  })
};

