import Sku from '../models/Sku.js';
import Location from '../models/Location.js';

// @desc    Search for SKUs and Locations
// @route   GET /api/search
export const searchUnits = async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ message: 'Query parameter "q" is required.' });
  }

  try {
    const regex = new RegExp(query, 'i'); // Case-insensitive regex

    const skuPromise = Sku.find({
      $or: [{ skuCode: regex }, { name: regex }],
    }).limit(5); // Limit results for autocomplete

    const locationPromise = Location.find({
      locationCode: regex,
    }).limit(5);

    const [skuResults, locationResults] = await Promise.all([skuPromise, locationPromise]);

    const formattedSkus = skuResults.map(s => ({
      id: s._id,
      name: `${s.skuCode} - ${s.name}`,
      type: 'SKU',
    }));

    const formattedLocations = locationResults.map(l => ({
      id: l._id,
      name: l.locationCode,
      type: 'Location',
    }));

    const results = [...formattedSkus, ...formattedLocations];

    res.status(200).json(results);
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};