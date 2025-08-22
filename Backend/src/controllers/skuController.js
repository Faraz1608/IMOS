import SKU from '../models/Sku.js';

// @desc    Get all SKUs
// @route   GET /api/skus
export const getSKUs = async (req, res) => {
  try {
    // For simplicity, we'll let any authenticated user see all SKUs
    const skus = await SKU.find({});
    res.status(200).json(skus);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new SKU
// @route   POST /api/skus
export const createSKU = async (req, res) => {
  try {
    const { skuCode, name, description, properties } = req.body;
    if (!skuCode || !name) {
      return res.status(400).json({ message: 'SKU code and name are required' });
    }
    
    const sku = await SKU.create({
      skuCode,
      name,
      description,
      properties,
      createdBy: req.user.id,
    });
    res.status(201).json(sku);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This SKU code already exists.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

export const searchSkus = async (req, res) => {
  const query = req.query.q;
  try {
    const regex = new RegExp(query, 'i');
    const skus = await Sku.find({
      $or: [{ skuCode: regex }, { name: regex }],
    }).limit(10);
    res.status(200).json(skus);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};