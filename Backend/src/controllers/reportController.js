import Inventory from '../models/Inventory.js';
import InventoryMovement from '../models/InventoryMovement.js';
import Sku from '../models/Sku.js';

// --- getInventoryReport function remains the same ---
export const getInventoryReport = async (req, res) => {
    // ... existing implementation
};

// @desc    Generate a CSV report of all SKUs with zero quantity
// @route   GET /api/reports/stockout
export const getStockoutReport = async (req, res) => {
    // ... existing implementation
};

// --- NEW FUNCTION ---
// @desc    Generate a CSV report of slow-moving inventory
// @route   GET /api/reports/slow-moving
export const getSlowMovingReport = async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find all SKUs that HAD a Goods Issue (GI) in the last 90 days
    const movedSkuIds = await InventoryMovement.distinct('sku', {
      type: 'GI',
      createdAt: { $gte: ninetyDaysAgo },
    });

    // Find all current inventory records for SKUs that are NOT in the moved list
    const slowMovingInventory = await Inventory.find({
      createdBy: req.user.id,
      sku: { $nin: movedSkuIds },
      quantity: { $gt: 0 } // Only include items that are actually in stock
    })
    .populate({ path: 'sku', select: 'skuCode name' })
    .populate({
        path: 'location',
        select: 'locationCode',
        populate: { path: 'layout', select: 'name' }
    });

    if (slowMovingInventory.length === 0) {
      return res.status(404).json({ message: 'No slow-moving inventory found.' });
    }

    // --- Generate CSV ---
    const csvHeaders = 'SKU Code,Product Name,Layout,Location Code,Quantity,Last Modified\n';
    const csvRows = slowMovingInventory.map(item => {
      const skuCode = item.sku ? item.sku.skuCode : 'N/A';
      const skuName = item.sku ? item.sku.name : 'N/A';
      const layoutName = item.location?.layout ? item.location.layout.name : 'N/A';
      const locationCode = item.location ? item.location.locationCode : 'N/A';
      const lastModified = item.updatedAt.toISOString().split('T')[0];
      return `"${skuCode}","${skuName}","${layoutName}","${locationCode}",${item.quantity},"${lastModified}"`;
    }).join('\n');

    const csv = csvHeaders + csvRows;

    res.header('Content-Type', 'text/csv');
    res.attachment('slow-moving-report.csv');
    res.status(200).send(csv);

  } catch (error) {
    console.error('Error generating slow-moving report:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

