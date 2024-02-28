//const path = require('path');
const express = require('express');
const { body } = require('express-validator');

const router = express.Router();
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');



// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post('/add-product',
    [
        body('title')
            .isString()
            .isLength({ min: 5 })
            .trim(),

        body('price').isFloat(),

        body('description')
            .isLength({ min: 5, max: 400 })
            .trim()
    ],
    isAuth,
    adminController.postAddProduct);

// // /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:id', isAuth, adminController.getEditProduct);

router.post('/edit-product',
    [
        body('title')
            .isString()
            .isLength({ min: 5 })
            .trim(),


        body('price').isFloat(),

        body('description')
            .isLength({ min: 5, max: 400 })
            .trim()
    ],
    isAuth,
    adminController.postEditProduct);

/* router.post('/delete-product', isAuth, adminController.postDeleteProduct); */
/* i can write the upper one also but it is good practice to show what is your intention with the route */
router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
