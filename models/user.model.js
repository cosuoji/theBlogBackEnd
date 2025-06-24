import { Schema } from "mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema({
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false
    },
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer"   
    },
    phone: {
        type: String,
        validate: {
            validator: function(v) {
                return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(v);
            },
            message: "Please enter a valid phone number"
        }
    },
    // New ecommerce fields
    profile: {
      firstName: String,
      lastName: String,
      phone: String,
      avatar: String
    },
    addresses: [{
      type: { type: String, enum: ["home", "work", "other"] },
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      isDefault: Boolean
    }],
    paymentMethods: [{
      type: { type: String, enum: ["credit_card", "paypal"] },
      last4: String,
      brand: String,
      isDefault: Boolean
    }],
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    cart: { type: Schema.Types.ObjectId, ref: "Cart" },
    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Order"
    }],
    refreshTokens: [String],// Alternative to Redis if needed
      // ✅ NEW FOR PASSWORD RESET:
  resetPasswordToken: String,
  resetPasswordExpires: Date
  }, { timestamps: true });


// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


// Add to cart method
userSchema.methods.addToCart = async function(productId, quantity = 1) {
    let cart = await Cart.findOne({ user: this._id });
    
    if (!cart) {
      cart = new Cart({ user: this._id, items: [] });
    }
  
    const existingItem = cart.items.find(item => item.product.equals(productId));
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
  
    await cart.save();
    this.cart = cart._id;
    await this.save();
    return cart;
  };

// Add address method
userSchema.methods.addAddress = async function(addressData) {
    // If this is the first address, set as default
    if (this.addresses.length === 0) {
      addressData.isDefault = true;
    }
    
    this.addresses.push(addressData);
    await this.save();
    return this.addresses;
  };


// Add indexes for better performance
userSchema.index({ 'addresses.isDefault': 1 });
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;