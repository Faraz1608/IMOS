import Sku from '../models/Sku.js'; // Corrected import to use PascalCase

// @desc    Get all SKUs
// @route   GET /api/skus
export const getSKUs = async (req, res) => {
  try {
    // For simplicity, we'll let any authenticated user see all SKUs
    const skus = await Sku.find({}); // Corrected usage
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
    
    const sku = await Sku.create({ // Corrected usage
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

// @desc    Search for SKUs
// @route   GET /api/skus/search
export const searchSkus = async (req, res) => {
  const query = req.query.q;
  try {
    const regex = new RegExp(query, 'i');
    const skus = await Sku.find({ // Corrected usage
      $or: [{ skuCode: regex }, { name: regex }],
    }).limit(10);
    res.status(200).json(skus);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single SKU by ID
// @route   GET /api/skus/:id
export const getSkuById = async (req, res) => {
  try {
    const sku = await Sku.findById(req.params.id); // Corrected usage

    // Add a check to ensure sku.createdBy exists before checking ownership
    if (!sku || !sku.createdBy || sku.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.status(200).json(sku);
  } catch (error) {
    console.error('Error in getSkuById:', error); // Added for better debugging
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update an SKU
// @route   PUT /api/skus/:id
export const updateSku = async (req, res) => {
  try {
    let sku = await Sku.findById(req.params.id); // Corrected usage
    if (!sku || !sku.createdBy || sku.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    sku = await Sku.findByIdAndUpdate(req.params.id, req.body, { new: true }); // Corrected usage
    res.status(200).json(sku);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};