/* const products = []; */
const fs = require('fs');
const path = require('path');

const Cart = require('./Cart');


/* describing the path where to store the data */
const p = path.join(
  path.dirname(process.mainModule.filename),
  'data',
  'products.json'
);


const getProductsFromFile = cb => {
  fs.readFile(p, (err, fileContent) => {
    if (err) {
      cb([]);
    } else {
      cb(JSON.parse(fileContent));
    }
  });
};

module.exports = class Product {
  constructor(id, title, imageUrl, price, description) {
    this.id = id,
      this.title = title;
    this.imageUrl = imageUrl;
    this.price = price;
    this.description = description;
  }

  save() {
    /* products.push(this);   *//* here this is called the local object, it referencing the title variable */

    /* saving the data to the files */
    getProductsFromFile(products => {
      //updating the existing data
      if (this.id) {
        const existingProductIndex = products.findIndex(
          prod => prod.id === this.id
        );
        const updatedProducts = [...products];
        updatedProducts[existingProductIndex] = this;
        fs.writeFile(p, JSON.stringify(updatedProducts), err => {
          console.log(err);
        });
      } else {
        // add new product
        this.id = Math.random().toString();
        products.push(this);
        fs.writeFile(p, JSON.stringify(products), err => {
          console.log(err);
        });
      }
    });


    /* now the reading the file */
    /*  fs.readFile(p, (err, fileContent) => {
         let products = [];     /* if there is no value , creating an empty array to avoid error 
         if (!err) {
             products = JSON.parse(fileContent);   /* if there is no error , getting the data from the file / parsing the data string into in object notation 
         }

         products.push(this);  /* adding the new value to the file 

         fs.writeFile(p, JSON.stringify(products, (err) => console.log(err)))   /* adding/writing the file 
     }) */
  }

  /* here i am not creating or pushing the data
     i am just getting all the data so i will make this method static 
  */

  static fetchAll(cb) {
    getProductsFromFile(cb);
  }


  static findByIdAndDelete(id) {
    getProductsFromFile((products) => {
      const product = products.find(prod => prod.id === id);
      const updatedPost = products.filter(prod => prod.id !== id);
      fs.writeFile(p, JSON.stringify(updatedPost), err => {
        if (!err) {
          Cart.deleteProduct(id, product.price);
        }
      });
    });
  };



  static findById(id, cb) {
    /* as we know the products details is parsed in json , so, it is 
    of type array , so we can just apply the find method to find the 
    specific product */
    getProductsFromFile(products => {
      const product = products.find(p => p.id === id);
      cb(product);
    })
  }
}