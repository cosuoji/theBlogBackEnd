import Shoe from "../models/shoe.model.js";
import asyncHandler from 'express-async-handler';
import { imagekit } from "../routes/auth.routes.js";
import ColorOption from "../models/color.option.model.js";
import MaterialOption from "../models/material.option.model.js";
import LastOption from "../models/last.option.model.js";
import SoleOption from "../models/sole.option.model.js";
import Collection from "../models/collection.model.js";
import Category from "../models/category.model.js";


export const getShoes = asyncHandler(async (req, res) => {
    try {
        const shoes = await Shoe.find({ isActive: true })
          .populate('categories')
          .populate('colorOptions')
          .populate('soleOptions')
          .populate('lastOptions')
          .populate('materialOptions');
        res.json(shoes);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
})

export const getSingleShoe = asyncHandler(async(req, res)=>{
    try {
        const shoe = await Shoe.findById(req.params.productId)
          .populate('categories')
          .populate('colorOptions')
          .populate('soleOptions')
          .populate('lastOptions')
          .populate('materialOptions');
        
        if (!shoe) return res.status(404).json({ message: 'Shoe not found' });
        res.json(shoe);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
})

export const createNewShoe = asyncHandler(async(req, res) => {
      try {
        // Create initial shoe document
        const shoe = new Shoe({
            ...req.body,
            slug: generateSlug(req.body.name)
        });

        // Save the shoe (this will trigger pre-save hooks)
        await shoe.save();
        
        res.status(201).json(shoe);
    } catch (err) {
        res.status(400).json({ 
            message: err.message,
            errors: err.errors || null
        });
    }
});


export const updateShoe = asyncHandler(async(req, res)=>{
    try {
        const shoe = await Shoe.findByIdAndUpdate(
          req.params.id,
          { ...req.body, slug: generateSlug(req.body.name) },
          { new: true }
        );
        res.json(shoe);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
})

export const deleteShoe = asyncHandler(async(req, res)=>{
    try {
        const shoe = await Shoe.findById(req.params.id);
        
        if (!shoe) {
          return res.status(404).json({ message: 'Shoe not found' });
        }
    
        // Optional: Clean up associated images from ImageKit
        await cleanupShoeImages(shoe);
    
        await Shoe.findByIdAndDelete(req.params.id);
        
        res.json({ 
          message: 'Shoe deleted successfully',
          deletedShoe: shoe
        });
      } catch (err) {
        res.status(500).json({ 
          message: 'Failed to delete shoe',
          error: err.message 
        });
      }
})

export const getColors = asyncHandler(async(req, res) =>{
  try {
    const colors = await ColorOption.find({ isActive: true });
    res.json(colors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})


export const getMaterials = asyncHandler(async(req, res) =>{
  try {
    const materials = await MaterialOption.find();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})


export const getLasts = asyncHandler(async(req, res) =>{
  try {
    const lasts = await LastOption.find();
    res.json(lasts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})


export const getSoles = asyncHandler(async(req, res) =>{
  try {
    const materials = await SoleOption.find();
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

export const getCategory = asyncHandler(async(req, res) =>{
  try {
    const categories = await Category.find()
      .populate('parent', 'name slug');   
    // Organize into hierarchy
    const hierarchy = buildCategoryTree(categories);
    res.json(hierarchy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

export const getCollection = asyncHandler(async(req, res) =>{
  try {
    const collection = await Collection.find();
    res.json(collection);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

export const createColor = asyncHandler(async(req, res)=>{
    try {
      const color = new ColorOption({
        name: req.body.name,
        hexCode: req.body.hexCode
      });
      
      await color.save();
      res.status(201).json(color);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
})



export const createSole = asyncHandler(async(req, res)=>{
  try {
    const sole = new SoleOption(req.body);
    await sole.save();
    res.status(201).json(sole);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
})



export const createMaterials = asyncHandler(async(req, res)=>{
  try {
    const materials = new MaterialOption(req.body);
    await materials.save();
    res.status(201).json(materials);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
})

export const createLasts = asyncHandler(async(req, res)=>{
  try {
    const last = new LastOption(req.body);
    await last.save();
    res.status(201).json(last);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
})

export const createCollection = asyncHandler(async(req, res)=>{
  try {
    const collection = new Collection(req.body);
    await collection.save();
    res.status(201).json(collection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
})

export const createCategory = asyncHandler(async(req, res)=>{
  try{
    const category = new Category({
    name: req.body.name,
    parent: req.body.parent || null, // Can be null for top-level
    description: req.body.description,
    isFeatured: req.body.isFeatured || false
  });

  await category.save();
  res.status(201).json(category);
} catch (err) {
  res.status(400).json({ message: err.message });
}
})







// Updated generateVariants function
const generateVariants = (options) => {
  const variants = [];
  
  options.colorOptions.forEach((color, colorIndex) => {
      options.sizeOptions.forEach(size => {
          options.widthOptions.forEach(width => {
              options.soleOptions.forEach((sole, soleIndex) => {
                  options.lastOptions.forEach((last, lastIndex) => {
                      options.materialOptions.forEach((material, materialIndex) => {
                          variants.push({
                              color: color._id ? color._id : color, // Handle both cases
                              size,
                              width,
                              soleType: sole._id ? sole._id : sole,
                              lastType: last._id ? last._id : last,
                              material: material._id ? material._id : material,
                              sku: `SH-${options.shoeId.toString().slice(-4)}-${colorIndex}${soleIndex}-${size}-${width.charAt(0)}`,
                              priceAdjustment: 0,
                              stock: 0
                          });
                      });
                  });
              });
          });
      });
  });
  
  return variants;
};

  
  function generateSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }


// Helper function to build category tree
function buildCategoryTree(categories, parentId = null) {
  const result = [];
  
  categories.filter(cat => 
    (cat.parent && cat.parent._id.toString() === parentId?.toString()) || 
    (!cat.parent && !parentId)
  ).forEach(cat => {
    result.push({
      ...cat.toObject(),
      children: buildCategoryTree(categories, cat._id)
    });
  });
  
  return result;
}

  async function cleanupShoeImages(shoe) {
    try {
      const imageIds = [];
      
      // Collect all image public IDs
      shoe.colorOptions.forEach(color => {
        color.images.forEach(img => {
          if (img.publicId) imageIds.push(img.publicId);
        });
      });
      
      // Delete in batches if many images
      while (imageIds.length > 0) {
        const batch = imageIds.splice(0, 100); // ImageKit allows 100 files per delete request
        await imagekit.bulkDeleteFiles(batch);
      }
    } catch (err) {
      console.error('Image cleanup failed:', err);
      // Fail silently as the main deletion should still proceed
    }
  }