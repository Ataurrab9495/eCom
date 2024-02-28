// const MProduct = require('../models/mongodbProduct');
// const Cart = require('../models/fileCart');
const Order = require('../models/orders.mongoose');
const Product = require('../models/product.mongoose')
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const stripe = require('stripe')('sk_test_51Kqa9GSIkC1IDMXx9lWZwZ8nabmwLOAcZZXl21IfCoR16X1F3cXwow5N6a1SeCcctKQgcKG0bXGEQheGeM8VPhpC00te1PckyT')

const ITEMS_PER_PAGE = 2;
exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE);
        })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Products',
                path: '/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        }).then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);  // this will skip all the middleware and will go to the error middleware
        })
};



exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .then(users => {
            const products = users.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products,
                isAuthenticated: req.session.isLoggedIn
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);  // this will skip all the middleware and will go to the error middleware
        })
};



exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            console.log(result);
            res.redirect('/cart');
        });
};


exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user
        .removeFromCart(prodId)
    res.redirect('/cart')
    /*  .then(result => {
       console.log(result)
       res.redirect('/cart')
     })
     .catch(err => console.log(err)) */
}



exports.getProductDetail = (req, res, next) => {
    const prodId = req.params.id;
    /* Finds a single document by its _id field. 
    findById(id) is almost* equivalent to findOne({ _id: id }). 
    behind the scenes it converts the string to object that's why we
    can pass findById(prodId) like this instead of like findById({_id: prodId})
    */
    Product.findById(prodId)
        .then(products => {
            res.render('shop/product-detail', {
                product: products,
                pageTitle: products.title,
                path: '/products',
                isAuthenticated: req.session.isLoggedIn
            })
        })
};

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    req.user
        .populate('cart.items.productId')
        .then(user => {
            products = user.cart.items;
            total = 0;
            products.forEach(p => {
                total += p.quantity * p.productId.price;
            });

            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map(p => ({
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: p.productId.title,
                            description: p.productId.description,
                        },
                        unit_amount: Math.round(p.productId.price * 100),
                    },
                    quantity: p.quantity
                })),
                mode: 'payment',
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
                cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
            });
        })
        .then(session => {
            res.render('shop/checkout', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                totalSum: total,
                sessionId: session.id
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.getCheckoutSuccess = (req, res, next) => {
    req.user.populate('cart.items.productId')  /* populating the data from the productid that contained in cart.items */
        /* now extracting all the data from the cart items and setting the variable procduct
            and saving the data according to the order schema that we have defined. 
        */
        .then((user) => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } }
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user._id
                },
                products: products
            })
            return order.save();
        }).then(result => {
            return req.user.clearCart();
        })
        .then(result => {
            res.redirect('/orders')
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);  // this will skip all the middleware and will go to the error middleware
        })
};



exports.postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId')  /* populating the data from the productid that contained in cart.items */
        /* now extracting all the data from the cart items and setting the variable procduct
            and saving the data according to the order schema that we have defined. 
        */
        .then((user) => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } }
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user._id
                },
                products: products
            })
            return order.save();
        }).then(result => {
            return req.user.clearCart();
        })
        .then(result => {
            res.redirect('/orders')
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);  // this will skip all the middleware and will go to the error middleware
        })
};


exports.getOrders = (req, res, next) => {
    Order.find({ "user.userId": req.user._id })
        .then(orders => {
            console.log(orders)
            res.render('shop/orders', {
                orders: orders,
                path: '/orders',
                pageTitle: 'Your Orders',
                isAuthenticated: req.session.isLoggedIn
            });
        })
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    /* here i want, if the current user is logged in and if that user matches it's id with it's
    order and orderId then the user can download , particular user can't download
    the other's user invoice.
    1. checking from order id where order exists or not.
    2. from that orderId i will check if the current user id is equal to that
        user id which is associated with the current order. */

    Order.findById(orderId).then(order => {
        if (!order) {
            return next(new Error('Order is not found'));
        }

        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('UnAuthorized Access.'));
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        /*  fs.readFile(invoicePath, (err, data) => {
             if (err) {
                 return next(err);
             }
             res.setHeader('Content-Type', 'application/pdf');
             //this sets the dowloading option in backend i.e. content-disposition , attachement and inline both are downloading option
             res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
             res.send(data);
         }); */
        // creating a pdf using pdfKit
        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        //this sets the dowloading option in backend i.e. content-disposition , attachement and inline both are downloading option
        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
        // this actaully also turns out to be a readable stream
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        pdfDoc.fontSize(26).text('Invoice', {
            underline: true,
        });
        pdfDoc.text('--------------------');
        let totalPrice = 0;
        order.products.forEach(prod => {
            totalPrice += prod.quantity * prod.product.price;
            pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
        });
        pdfDoc.text('------');
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
        pdfDoc.end();
        /* here we are using readFile, well, it is good for tiny files but
        it is not good for huge files. for that we are going to use the stream, we
        will stream the data , so that it will go to the browser in chunks, so
        that it will load faster.
        */

        /*  const file = fs.createReadStream(invoicePath);
         
         file.pipe(res); */

    }).catch(err => next(err));
};

// exports.getCheckout = (req, res, next) => {
//   res.render('shop/checkout', {
//     path: '/checkout',
//     pageTitle: 'Checkout'
//   });
// };
