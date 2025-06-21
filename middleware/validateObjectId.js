// middleware/validateObjectId.js
import mongoose from 'mongoose';

export const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
};

export const validateMagazine = (req, res, next) => {
  if (req.body.productType === 'magazine') {
    const issueNumber = Number(req.body.magazineData?.issueNumber);
    if (isNaN(issueNumber)) {
      return res.status(400).json({ message: 'Invalid issue number' });
    }
    req.body.magazineData.issueNumber = issueNumber;
  }
  next();
};           