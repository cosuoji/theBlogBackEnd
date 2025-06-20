// routes/blogRoutes.js
import express from 'express';
import { adminRoute, protectRoute } from '../middleware/auth.middleware.js';
import Blog from '../models/blog.model.js';
const postRoutes = express.Router();


// Create blog post
// routes/postRoutes.js
postRoutes.post('/', protectRoute, adminRoute, async (req, res) => {
  try {
    console.log('Received data:', req.body); // Debug incoming data

    // const { 
    //   title,
    //   description,
    //   headerImageUrl,
    //   innerImageForFeaturedUrl,
    //   featured,
    //   author,
    //   slug,
    //   category,
    //   tags,
    //   contentBlocks,
    //   publishedAt
    // } = req.body;

    // const blog = new Blog({
    //   title,
    //   description,
    //   headerImage: headerImageUrl, // Now storing URL
    //   innerImageForFeatured: innerImageForFeaturedUrl, // Now storing URL
    //   featured,
    //   author,
    //   slug,
    //   category,
    //   tags: JSON.parse(tags),
    //   contentBlocks: JSON.parse(contentBlocks),
    //   publishedAt: new Date(publishedAt)
    //});

    const blog = new Blog({
      ...req.body,
      // No need for JSON.parse since express.json() handles it
    });

    await blog.save();
    
    res.json({
      success: true,
      data: blog
    });
    
  } catch (err) {
    console.error('Error creating blog:', {
      error: err,
      body: req.body,
      headers: req.headers
    });
    res.status(400).json({
      success: false,
      error: err.message || 'Blog creation failed'
    });
  }
});

// Get all blog posts
postRoutes.get('/', async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find().sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit);;

    const totalBlogs = await Blog.countDocuments();


    res.json({
      blogs,
      total: totalBlogs,
      page,
      pages: Math.ceil(totalBlogs / limit),
    });


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single blog post
postRoutes.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

postRoutes.delete("/:slug", protectRoute, adminRoute, async (req, res) => {
    try {
        // 1. Find the blog post to delete
        const blog = await Blog.findOne({ slug: req.params.slug });
        if (!blog) {
            return res.status(404).json({ 
                success: false,
                error: 'Blog post not found' 
            });
        }

        // 2. [Removed Cloudinary image deletion steps]

        // 3. Delete the blog post from database
        await Blog.deleteOne({ slug: req.params.slug });

        // 4. Return success response
        res.json({ 
            success: true,
            message: 'Blog post deleted successfully',
            deletedPost: blog 
        });

    } catch (err) {
        console.error('Error deleting blog post:', err);
        res.status(500).json({ 
            success: false,
            error: err.message || 'Server error during deletion' 
        });
    }
});
export default postRoutes;

