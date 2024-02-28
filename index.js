const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const errorController = require('./controllers/error');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session)
/* const mongoConnect = require('./util/database').mongoConnect; */
const mongoose = require('mongoose');
const User = require('./models/user.mongoose');
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();



const store = new MongoDBStore({
    uri: process.env.MONGODB_URL,
    collection: 'mySessions'
})

const csrfProtection = csrf();

// Create the 'images' directory if it doesn't exist
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        /* const dest = path.join(__dirname, 'images'); */
        return cb(null, './images');  
    },
    filename: (req, file, cb) => {
        try {
            const fileName = new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname;
            console.log('File Name:', fileName);
            return cb(null, fileName);
        } catch (error) {
            cb(error, null);
        }
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

/* setting the template engine */
app.set('view engine', 'ejs');
app.set('views', 'views');
/* setting the template engine */


const adminData = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');


app.use(bodyParser.urlencoded({ extended: false }));
 app.use(
   multer({storage: fileStorage, fileFilter}).single('image')
);  //setting the multer
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images' ,express.static(path.join(__dirname, 'images')));
app.use(
    session(
        {
            secret: 'my secret and this is very powerfull',
            resave: false,                 /* it means that the session is not going to be saved in every request */
            saveUninitialized: false,       /* it means that the session is not going to be saved in every request */
            store: store
        }
    )
);

app.use(csrfProtection);
app.use(flash());


app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        // throw new Error('dummy error')
        .then(user => {
            if (!user) {  // if user not found it will go next
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));  // it will throw an error
        })
});




app.use('/admin', adminData);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

/* this is the special middleware that express has. whenever we write something
    like next(error) it will skip all the middleware and will execute only middleware
    that has app.use((error, req, res, next))
*/

app.use((error, req, res, next) => {
    console.log(error);
    res.status(500).render('500', {
        pageTitle: 'Error',
        path: '/500',
        isAuthenticated: req.session?.isLoggedIn
    })
})


mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        /*  User.findOne().then(user => {  /* creating the user
             if (!user) {
                 const user = new User({
                     username: "max",
                     email: "max@gmail.com",
                     cart: {
                         items: []
                     }
                 })
                 user.save()
             }
         }) */
        app.listen(3000)
        console.log("connected successfully")
    }).catch(err => console.log(err))

/* mongoConnect(() => {
    app.listen(3000);
}) */