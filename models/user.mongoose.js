const mongoose = require('mongoose');
const productMongoose = require('./product.mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    /* username: {
        type: String,
        required: true,
    }, */
    email: {
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
    resetToken: String,  // we don't require this everytime that's why i am not using the required: true
    resetTokenExpiration: Date,
    cart: {
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, },
                quantity: { type: Number, required: true, }
            }
        ]
    },

});


/* this methods gives us power to add custom functions to manipulate data in mongodb
    through mongoose.
*/
UserSchema.methods.addToCart = function (product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });

    let netQuantity = 1;
    let updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
        netQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = netQuantity;
    } else {
        updatedCartItems.push(
            {
                productId: product._id,
                quantity: netQuantity
            }
        );
    }

    const updatedCart = {
        items: updatedCartItems
    }

    this.cart = updatedCart;
    this.save();
}


UserSchema.methods.removeFromCart = function (productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString();
    });

    this.cart.items = updatedCartItems;
    return this.save();
}


UserSchema.methods.clearCart = function () {
    this.cart = { items: [] }
    return this.save();
}

module.exports = mongoose.model('User', UserSchema);