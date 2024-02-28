// Importing necessary modules and components
const express = require('express');
const { check, body } = require('express-validator');

// Importing authentication controller
const authController = require('../controllers/auth');

// Creating an Express router
const router = express.Router();

// Handling GET request for login page
router.get('/login', authController.getLogin);

// Handling GET request for signup page
router.get('/signup', authController.getSignup);

// Handling POST request for login with input validation using express-validator
router.post('/login', [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid Email.')
        .normalizeEmail(),  /* it will sanitize the value if user put the capital letter by mistake it will convert it into small letter */

    body('password',
        'please enter a password with only numbers and text and at least 5 characters.'
    )
        .isLength({ min: 5 })
        .isAlphanumeric()
        .trim()     // it removes the extra space
], authController.PostLogin);



// Handling POST request for signup with input validation using express-validator
router.post('/signup',
    [check('email')
        .isEmail()
        .withMessage('Please enter a valid Email.')
        .normalizeEmail(),

    /* here in this password validator the second arguement is working as a custom message that we want to show as an error message this is also a way we can do this */
    body('password',
        'please enter a password with only numbers and text and at least 5 characters.')
        .isLength({ min: 5 })
        .isAlphanumeric()
        .trim(),

    body('confirmPassword').trim().custom((value, { req }) => {
        // Checking if the password and confirmPassword match
        if (value !== req.body.password) {
            throw new Error('Passwords do not match.');
        }
        return true;
    })
    ],
    authController.postSignup);

// Handling POST request for user logout
router.post('/logout', authController.PostLogout);

// Handling GET request for password reset page
router.get('/reset', authController.getReset);

// Handling POST request for initiating password reset
router.post('/reset', authController.postReset);

// Handling GET request for setting a new password using a reset token
router.get('/reset/:token', authController.getNewPassword);

// Handling POST request for updating the password with a reset token
router.post('/new-password', authController.postNewPassword);

// Exporting the router for use in other parts of the application
module.exports = router;
