// const mongodb = require('mongodb')
// const MProduct = require('../models/mongodbProduct');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Product = require('../models/product.mongoose');
const fileHelper = require('../util/file');

/* const objectId = mongodb.ObjectId; */

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
    isAuthenticated: req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  console.log(image + "this is the error you are talking about.");

  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image.',
      validationErrors: []
    });
  }
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,

        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const imageUrl = image.path;

  const product = new Product({
    
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
     
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const { id } = req.params;
  Product.findById(id).then((product) => {
    if (!product) {
      return res.redirect('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/add-product',
      editing: editMode,
      hasError: false,
      product: product,
      errorMessage: null,
      validationErrors: []
    });
  });
};


exports.postEditProduct = (req, res, next) => {
  const id = req.body.productId;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: id
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  /* here , i am finding the id from product so that we can update
    the existing data, now as we can see we can access the product in
    then method and i am saving the data as i am saving here in existing 
    data it will gonna update the value it will not gonna overwrite that. 
  */

  Product.findById(id).then(product => {
    if (product.userId.toString() !== req.user._id.toString()) {
      return res.redirect('/');
    }
    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDesc;
    if (image) {
      fileHelper.deleteFile(product.imageUrl);  // i am not waiting here to be completed as it is not important over here.
      product.imageUrl = image.path;
    }

    return product.save()
      .then(result => {
        res.redirect('/admin/products')
      })
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);  // this will skip all the middleware and will go to the error middleware
  })
};




exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    /* .populate('userId') */  /* it is used populate all the related data that path we giving as a parameter */
    .then(products => {
      console.log(products)
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn
      });
    });
};


exports.deleteProduct = (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
    .then(product => {
      if (!product) {
        return next(new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.imageUrl); // here i deleted the image and immidiate after i deleted the product.
      return Product.deleteOne({ _id: id, userId: req.user._id });
    })
    .then(() => {
      /* res.redirect('/admin/products'); */
      res.status(200).json({ message: 'Success!' });
    })
    .catch(() => {
      /* const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); */
      res.status(500).json({ message: 'Deleting product failed.' });
    })
} 