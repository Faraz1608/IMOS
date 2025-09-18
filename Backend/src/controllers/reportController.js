import Inventory from '../models/Inventory.js';
import InventoryMovement from '../models/InventoryMovement.js';
import Sku from '../models/Sku.js';

/**
 * @desc   Generate and download a CSV report of all inventory
 * @route  GET /api/reports/inventory
 */
export const getInventoryReport = async (req, res) => {
  try {
    const inventory = await Inventory.find({})
      .populate({ path: 'sku', select: 'skuCode name' })
      .populate({
        path: 'location',
        select: 'locationCode',
        populate: { path: 'layout', select: 'name' }
      });

    if (inventory.length === 0) {
      return res.status(404).json({ message: 'No inventory found to generate a report.' });
    }

    // Prepare CSV headers & rows
    const csvHeaders = 'SKU Code,Product Name,Layout,Location Code,Quantity,Batch Number,Serial Number\n';
    const csvRows = inventory.map(item => {
      const skuCode = item.sku ? item.sku.skuCode : 'N/A';
      const skuName = item.sku ? item.sku.name : 'N/A';
      const layoutName = item.location?.layout ? item.location.layout.name : 'N/A';
      const locationCode = item.location ? item.location.locationCode : 'N/A';
      const batch = item.batchNumber || '';
      const serial = item.serialNumber || '';
      return `"${skuCode}","${skuName}","${layoutName}","${locationCode}",${item.quantity},"${batch}","${serial}"`;
    }).join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('inventory-report.csv');
    res.status(200).send(csvHeaders + csvRows);
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc   Generate and download a CSV report of all stockouts (items with qty <= 0)
 * @route  GET /api/reports/stockouts
 */
export const getStockoutReport = async (req, res) => {
  try {
    const stockouts = await Inventory.find({ quantity: { $lte: 0 } })
      .populate('sku', 'skuCode name');

    if (stockouts.length === 0) {
      return res.status(404).send('No stockouts found.');
    }

    const csvHeaders = 'SKU Code,Product Name,Last Known Quantity\n';
    const csvRows = stockouts
      .map(item => `"${item.sku.skuCode}","${item.sku.name}",${item.quantity}`)
      .join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('stockout-report.csv');
    res.status(200).send(csvHeaders + csvRows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc   Generate and download a CSV report of slow-moving SKUs (no GI in last 90 days)
 * @route  GET /api/reports/slow-moving
 */
export const getSlowMovingReport = async (req, res) => {
  try {
    const ninetyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 90));

    // Get SKUs that had outbound (GI) movements in last 90 days
    const recentMovements = await InventoryMovement.distinct('sku', {
      type: 'GI',
      createdAt: { $gte: ninetyDaysAgo },
    });

    // Find SKUs that are NOT in recent movements = slow-moving
    const slowMovingSkus = await Sku.find({
      _id: { $nin: recentMovements },
    });

    if (slowMovingSkus.length === 0) {
      return res.status(404).send('No slow-moving items found.');
    }

    const csvHeaders = 'SKU Code,Product Name\n';
    const csvRows = slowMovingSkus
      .map(sku => `"${sku.skuCode}","${sku.name}"`)
      .join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('slow-moving-report.csv');
    res.status(200).send(csvHeaders + csvRows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
