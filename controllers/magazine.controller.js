import asyncHandler from 'express-async-handler';
import Product from '../models/product.model.js';
import Blog from '../models/blog.model.js';
// controllers/magazineController.js
// Update your existing magazineController.js
export const getMagazineWithArticles = asyncHandler(async (req, res) => {
  const { issueNumber } = req.params;
  const { search } = req.query; // Add search query parameter

  // Get magazine details
  const magazine = await Product.findOne({ 
    productType: 'magazine',
    'magazineData.issueNumber': issueNumber 
  });

  if (!magazine) {
    res.status(404);
    throw new Error('Magazine issue not found');
  }

  // Build article query
  const articleQuery = { magazineIssue: issueNumber };   
  
  // Add search filter if provided
  if (search) {
    articleQuery.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  // Get associated articles
  const articles = await Blog.find(articleQuery)
    .sort('-publishedAt')
    .select('title slug description headerImage publishedAt author tags');

  res.json({
    magazine,
    articles,
    searchQuery: search || '' // Return the search query used
  });
});

export const deleteMagazine = asyncHandler(async (req, res) => {
  const { issueNumber } = req.params;
  
  // Delete the magazine
  const magazine = await Product.findOneAndDelete({
      productType: 'magazine',
      'magazineData.issueNumber': issueNumber
  });

  if (!magazine) {
      res.status(404);
      throw new Error('Magazine not found');
  }

  // Optional: Delete associated articles
  await Blog.deleteMany({ magazineIssue: issueNumber });

  res.json({ message: 'Magazine deleted successfully' });
});