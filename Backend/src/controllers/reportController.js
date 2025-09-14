import Inventory from '../models/Inventory.js';
import InventoryMovement from '../models/InventoryMovement.js';
import Sku from '../models/Sku.js';

// Generate a CSV report of all inventory in the system
export const getInventoryReport = async (req, res) => {
  try {
    const inventory = await Inventory.find({}) // Find all inventory
      .populate({ path: 'sku', select: 'skuCode name' })
      .populate({
        path: 'location',
        select: 'locationCode',
        populate: { path: 'layout', select: 'name' }
      });

    if (inventory.length === 0) {
      return res.status(404).json({ message: 'No inventory found to generate a report.' });
    }

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

    const csv = csvHeaders + csvRows;

    res.header('Content-Type', 'text/csv');
    res.attachment('inventory-report.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Generate a CSV report of all stockouts in the system
export const getStockoutReport = async (req, res) => {
    try {
        const stockouts = await Inventory.find({ quantity: { $lte: 0 } })
            .populate('sku', 'skuCode name');

        if (stockouts.length === 0) {
            return res.status(404).send('No stockouts found.');
        }

        const csvHeaders = 'SKU Code,Product Name,Last Known Quantity\n';
        const csvRows = stockouts.map(item => {
            return `"${item.sku.skuCode}","${item.sku.name}",${item.quantity}`;
        }).join('\n');

        const csv = csvHeaders + csvRows;

        res.header('Content-Type', 'text/csv');
        res.attachment('stockout-report.csv');
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Generate a CSV report of slow-moving inventory across the system
export const getSlowMovingReport = async (req, res) => {
    try {
        const ninetyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 90));

        const recentMovements = await InventoryMovement.distinct('sku', {
            type: 'GI', // Goods Issue
            createdAt: { $gte: ninetyDaysAgo },
        });

        const slowMovingSkus = await Sku.find({
            _id: { $nin: recentMovements },
        });
        
        if (slowMovingSkus.length === 0) {
            return res.status(404).send('No slow-moving items found.');
        }

        const csvHeaders = 'SKU Code,Product Name\n';
        const csvRows = slowMovingSkus.map(sku => `"${sku.skuCode}","${sku.name}"`).join('\n');

        const csv = csvHeaders + csvRows;

        res.header('Content-Type', 'text/csv');
        res.attachment('slow-moving-report.csv');
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
