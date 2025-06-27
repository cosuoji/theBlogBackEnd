import slugify from "slugify";
import Product from "../models/product.model.js";
import asyncHandler from "express-async-handler"

// @desc    Create a product
// @route   POST /api/products
// @access  Admin
export const createProduct = asyncHandler(async (req, res) => {
  const { 
    name,
    price,
    description,
    stock,
    productType,
    magazineData
  } = req.body;

  // Parse magazineData if it's a string
  const magazineInfo = typeof magazineData === 'string' 
    ? JSON.parse(magazineData) 
    : magazineData;

  const product = new Product({
    name,
    price,
    description,
    stock,
    productType,
    ...(productType === 'magazine' && { 
      magazineData: magazineInfo 
    })
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

export const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.pageNumber) || 1;
  const { keyword, productType, featured } = req.query;

  const baseQuery = {};
  
  // Search keyword
  if (keyword) {
    baseQuery.name = { $regex: keyword, $options: 'i' };
  }

  // Product type filter
  if (productType) {
    baseQuery.productType = productType;
  }

  // Featured filter (primarily for magazines)
  if (featured === 'true' && productType === 'magazine') {
    baseQuery['magazineData.isFeatured'] = true;
  }

  // Sorting logic
  let sortOptions = {};
  if (productType === 'magazine') {
    sortOptions = { 'magazineData.issueNumber': -1 }; // Newest magazines first
  } else {
    sortOptions = { createdAt: -1 }; // Newest products first
  }

  const count = await Product.countDocuments(baseQuery);
  const products = await Product.find(baseQuery)
    .sort(sortOptions)
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ 
    products, 
    page, 
    pages: Math.ceil(count / pageSize),
    productType: productType || 'all',
    count
  });
});


  export const getProductBySlug = asyncHandler(async (req, res) => {
    let product = await Product.findOne({ slug: req.params.slug })
   
  
    if (!product) {
      product = await Product.findById(req.params.slug)
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  
    res.json(product);
  });

  
  
  // @desc    Update a product
  // @route   PUT /api/products/:id
  // @access  Admin
  export const updateProduct = asyncHandler(async (req, res) => {
    const { name, price, description, stock, variants } = req.body;
  
    const product = await Product.findById(req.params.id);
  
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
  
    product.name = name || product.name;
    product.slug = name ? slugify(name) : product.slug;
    product.price = price || product.price;
    product.description = description || product.description;
    product.stock = stock || product.stock;
    product.variants = variants || product.variants;
  
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  });

  export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
  
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
  
    await product.remove();
    res.json({ message: 'Product removed' });
  });

  // In productController.js
export const getMagazines = asyncHandler(async (req, res) => {
  const magazines = await Product.find({ 
    productType: 'magazine'
  }).sort('-magazineData.issueNumber');
  
  res.json(magazines);
});

export const getFeaturedMagazines = asyncHandler(async (req, res) => {
  const magazines = await Product.find({ 
    productType: 'magazine',
    'magazineData.isFeatured': true
  }).limit(4);
  
  res.json(magazines);
});