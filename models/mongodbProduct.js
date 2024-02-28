const mongodb = require('mongodb')
const getDb = require('../util/database').getDb;

class Product {
    constructor(title, price, imageUrl, description, id, userId) {
        this.title = title;
        this.imageUrl = imageUrl;
        this.price = price;
        this.description = description;
        this._id = id;
        this.userId = userId;
    }

    save() {
        const db = getDb();
        let dbOp;
        if (this._id) {
            /* updating the existing value */
            dbOp = db.collection('products').updateOne({ _id: new mongodb.ObjectId(this._id) }, { $set: this });
        } else {
            /* saving the new data */
            dbOp = db.collection('products').insertOne(this);
        }
        return dbOp
            .then(result => console.log(result))
            .catch(err => console.log(err));
    }



    static fetchAll() {
        const db = getDb();
        return db.collection('products')
            .find().toArray()
            .then(products => {
                console.log(products);
                return products;
            })
            .catch(err => console.log(err))
    }


    static findById(prodId) {
        const db = getDb();
        return db.collection('products')
            .find({ _id: new mongodb.ObjectId(prodId) })  /* we pass this id like this is because mongodb's id storing format is something different */
            .next()
            .then(products => {
                console.log(products);
                return products;
            }).catch(err => console.log(err))
    }


    static deleteById(prodId) {
        const db = getDb();  // establishing the connection b/w db.
        return db.collection('products')
            .deleteOne({ _id: new mongodb.ObjectId(prodId) })
            .then((res) => {
                console.log(`Deleted product with _id : ${prodId} ,\n ${res}`);
            }).catch(err => console.log(err));
    }
}

module.exports = Product;