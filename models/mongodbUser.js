const mongodb = require('mongodb')
const getDb = require('../util/database').getDb;

class User {
    constructor(username, email, cart, id) {
        this.username = username;
        this.email = email;
        this.cart = cart;  // {items:[]}
        this._id = id;
    }




    save() {
        const db = getDb();
        return db.collection('users').insertOne(this)
            .then(res => console.log("data saved."))
            .catch(err => console.log(err))
    }

    /* here i am trying to post the cart in the user collection
       basically, i am referencing the product details to the user
       collection , here i am updating the cart . once you hit the add to cart button
       it will save the product id and quantity to the the user database; 
       (it will update the quantity of that particular item )
    */
    addToCart(product) {
        // this downwards code i write because i have to add items to the database
        /* const updatedCart = { items: [{ ...product, quantity: 1 }] };
        const db = getDb();
        return db.collection('users')
            .updateOne(
                { _id: new mongodb.ObjectId(this._id) },
                { $set: { cart: updatedCart } }
            ); */

        const cartProductIndex = this.cart.items.findIndex(cp => {
            return cp.productId.toString() === product._id.toString();
        });
        let newQuantity = 1;
        const updatedCartItems = [...this.cart.items];


        if (cartProductIndex >= 0) {
            newQuantity = this.cart.items[cartProductIndex].quantity + 1;
            updatedCartItems[cartProductIndex].quantity = newQuantity;
        } else {
            updatedCartItems.push({
                productId: new mongodb.ObjectId(product._id),
                quantity: newQuantity
            });
        }
        const updatedCart = {
            items: updatedCartItems
        };
        const db = getDb();
        return db
            .collection('users')
            .updateOne(
                { _id: new mongodb.ObjectId(this._id) },
                { $set: { cart: updatedCart } }
            )
            .then(result => {
                console.log("Update result:", result);
            })
            .catch(error => {
                console.error("Error updating cart:", error);
            });
    }



    getCart() {
        const db = getDb();
        /* here i have created the array of product id's from the cart items array */
        const productIds = this.cart.items.map(i => {
            return i.productId;
        });

        return db.collection('products')
            .find({ _id: { $in: productIds } })  // here i am using $in query parameter to identify the _id from the productId's array, basically i am matching the _id with array product id by traversing all the array
            .toArray()   // converting all the data to an array
            /* here i am attaching the quantity field to each product */
            .then(products => {
                return products.map(p => {
                    return {
                        ...p,   //here i am attaching all the product data and adding quantity to the database
                        quantity: this.cart.items.find(i => {
                            return i.productId.toString() === p._id.toString();
                        }).quantity
                    };
                });
            });
    };


    deleteItemFromCart(productId) {
        const updatedCartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString();
        })

        const db = getDb();
        db.collection('users')
            .updateOne(
                { _id: new mongodb.ObjectId(this._id) },
                { $set: { cart: { items: updatedCartItems } } }
            );
    };


    addOrder() {
        const db = getDb();
        /* here not only the id and quantity we require, we need whole product data to showcase in the order section
        and we need user's data also just because to keep record of who is the guy ordering right now*/
        return this.getCart().then(products => {
            const order = {
                items: products,
                user: {
                    _id: new mongodb.ObjectId(this._id),
                    username: this.username
                }
            };
            return db.collection('orders')
                .insertOne(order)  // here i added the cart data to the orders database
        }).then(result => {
            this.cart = { items: [] };  // deleting data from the cart variable
            return db
                .collection('users')
                .updateOne(
                    { _id: new mongodb.ObjectId(this._id) },
                    { $set: { cart: { items: [] } } }   //deleting from the database also
                );
        });
    };


    getOrders() {
        const db = getDb();
        return db.collection('orders')
        .find({'user._id': new mongodb.ObjectId(this._id)})
        .toArray();
    }

    /* diff. b/w find and findOne is : find gives us the cursor in return that's why we
        use next() method after the find method but on the other hand if we use findOne it doesn't 
        give us the cursor. so we don't have to use the next method
    */

    static findById(userId) {
        const db = getDb();
        return db
            .collection('users')
            .findOne({ _id: new mongodb.ObjectId(userId) })
            .then(user => {
                console.log(user);
                return user;
            })
            .catch(err => {
                console.log(err);
            });
    }
}


module.exports = User;