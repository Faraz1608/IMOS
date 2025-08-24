import Inventory from '../models/Inventory.js';

// @desc    Generate a CSV report of all inventory
// @route   GET /api/reports/inventory
export const getInventoryReport = async (req, res) => {
  try {
    const inventory = await Inventory.find({ createdBy: req.user.id })
      .populate({ path: 'sku', select: 'skuCode name' })
      .populate({
        path: 'location',
        select: 'locationCode',
        populate: { path: 'layout', select: 'name' }
      });

    if (inventory.length === 0) {
      return res.status(404).json({ message: 'No inventory found to generate a report.' });
    }

    // CSV Headers
    const csvHeaders = 'SKU Code,Product Name,Layout,Location Code,Quantity\n';

    // CSV Rows
    const csvRows = inventory.map(item => {
      const skuCode = item.sku ? item.sku.skuCode : 'N/A';
      const skuName = item.sku ? item.sku.name : 'N/A';
      const layoutName = item.location?.layout ? item.location.layout.name : 'N/A';
      const locationCode = item.location ? item.location.locationCode : 'N/A';
      // Escape commas within fields by wrapping in double quotes
      return `"${skuCode}","${skuName}","${layoutName}","${locationCode}",${item.quantity}`;
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