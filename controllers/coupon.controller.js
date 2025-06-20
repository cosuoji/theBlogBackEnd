import Coupon from "../models/coupon.model.js";
import asyncHandler from 'express-async-handler';

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Admin
export const createCoupon = asyncHandler(async (req, res) => {
    const { 
      code, 
      discountType, 
      discountValue, 
      minimumPurchase,
      startDate,
      endDate
    } = req.body;
  
    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minimumPurchase,
      startDate,
      endDate,
      createdBy: req.user._id
    });
  
    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
  });

  export const validateCoupon = asyncHandler(async (req, res) => {
    const { code, cartTotal } = req.body;
  
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
  
    if (!coupon) {
      res.status(404);
      throw new Error('Invalid or expired coupon');
    }
  
    if (coupon.minimumPurchase && cartTotal < coupon.minimumPurchase) {
      res.status(400);
      throw new Error(`Minimum purchase of $${coupon.minimumPurchase} required`);
    }
  
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      res.status(400);
      throw new Error('Coupon usage limit reached');
    }
  
    res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });
  });

  // @desc    Get all coupons
// @route   GET /api/coupons
// @access  Admin
export const getCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find({}).sort('-createdAt');
    res.json(coupons);
  });
  
  // @desc    Delete a coupon
  // @route   DELETE /api/coupons/:id
  // @access  Admin
  export const deleteCoupon = asyncHandler(async (req, res) => {
    const coupon = await Coupon.findById(req.params.id);
  
    if (!coupon) {
      res.status(404);
      throw new Error('Coupon not found');
    }
  
    await coupon.remove();
    res.json({ message: 'Coupon removed' });
  });
