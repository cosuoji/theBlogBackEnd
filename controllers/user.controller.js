import User from "../models/user.model.js";
import asyncHandler from 'express-async-handler';


// @desc    Get user addresses
// @route   GET /api/user/address
// @access  Private
export const getAddresses = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('addresses');
    res.json(user.addresses);
  });

  export const addAddress = asyncHandler(async (req, res) => {
    const { street, city, state, zipCode, country, type, isDefault } = req.body;
  
    const address = {
      type,
      street,
      city,
      state,
      zipCode,
      country,
      isDefault
    };
  
    const user = await User.findById(req.user._id);
  
    // If setting as default, remove default from others
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
  
    user.addresses.push(address);
    await user.save();
  
    res.status(201).json(user.addresses);
  });

  // @desc    Update address
// @route   PUT /api/user/address/:id
// @access  Private
export const updateAddress = asyncHandler(async (req, res) => {
    const { street, city, state, zipCode, country, type, isDefault } = req.body;
  
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);
  
    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }
  
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zipCode = zipCode || address.zipCode;
    address.country = country || address.country;
    address.type = type || address.type;
  
    // Handle default address change
    if (isDefault !== undefined) {
      if (isDefault) {
        user.addresses.forEach(addr => {
          addr.isDefault = false;
        });
      }
      address.isDefault = isDefault;
    }
  
    await user.save();
    res.json(user.addresses);
  });
  
  // @desc    Delete address
  // @route   DELETE /api/user/address/:id
  // @access  Private
  export const deleteAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    user.addresses.pull(req.params.id);
    await user.save();
    res.json(user.addresses);
  });
  
  // @desc    Set default address
  // @route   PUT /api/user/address/:id/set-default
  // @access  Private
  export const setDefaultAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    
    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === req.params.id;
    });
  
    await user.save();
    res.json(user.addresses);
  });

  export const updateProfile = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone } = req.body;
  
    // Validate required fields
    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }
  
    // Check if email is already taken by another user
    const emailExists = await User.findOne({ 
      email,
      _id: { $ne: req.user._id } // Exclude current user
    });
  
    if (emailExists) {
      res.status(400);
      throw new Error('Email is already in use');
    }
  
    const user = await User.findById(req.user._id);
  
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
  
    // Update profile fields
    user.email = email || user.email;
    user.profile = {
      firstName: firstName || user.profile?.firstName,
      lastName: lastName || user.profile?.lastName,
      phone: phone || user.profile?.phone
    };
  
    const updatedUser = await user.save();
  
    // Return the updated profile without sensitive data
    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.profile
    });
  });

  export const addToWishList = asyncHandler(async(req, res)=>{
    try {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { wishlist: req.body.productId } },
        { new: true }
      ).populate('wishlist');
      res.json(user.wishlist);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })

  export const removeFromWishList = asyncHandler(async (req, res) => {
    try {
      const { productId } = req.params;
  
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { wishlist: productId } },  // NOTE: plain string, not ObjectId!
        { new: true }
      ).populate('wishlist');
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json(user.wishlist);
  
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  

  export const getWishList = asyncHandler(async (req, res) => {
    try {
      const user = await User.findById(req.user._id).populate('wishlist');
      res.json(user.wishlist);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })

  