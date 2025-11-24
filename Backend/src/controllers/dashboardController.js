import Sku from '../models/Sku.js';
import Dispatch from '../models/Dispatch.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Layout from '../models/Layout.js';
import Location from '../models/Location.js';
import Inventory from '../models/Inventory.js';

// Get all dashboard statistics for the entire system
export const getDashboardStats = async (req, res) => {
  try {
    // --- KPI Card Stats ---
    const totalSkus = await Sku.countDocuments();
    const pendingDispatches = await Dispatch.countDocuments({ status: 'Pending Dispatch' });

    // --- Role Distribution ---
    const userRoles = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const activeUsers = await User.countDocuments();

    // --- Layout & Global Utilization Calculation ---
    const layouts = await Layout.find({});
    const allLocations = await Location.find({});
    const allInventory = await Inventory.find({}).populate('sku');

    // Helper function to calculate volume
    const getVolumeCm3 = (dimensions) => {
        return (dimensions?.w || 0) * (dimensions?.d || 0) * (dimensions?.h || 0);
    };

    // Map layout ID to stats
    const layoutStats = {};
    layouts.forEach(l => {
        layoutStats[l._id.toString()] = {
            name: l.name,
            capacity: 0,
            occupied: 0
        };
    });

    // Calculate Capacity (Sum of Location Volumes)
    const locationMap = {}; // Map location ID to layout ID for inventory lookup
    allLocations.forEach(loc => {
        // Convert Location volume (m³) to cm³ by multiplying by 1,000,000
        const volCm3 = getVolumeCm3(loc.properties?.dimensions) * 1000000;
        const layoutId = loc.layout.toString();
        if (layoutStats[layoutId]) {
            layoutStats[layoutId].capacity += volCm3;
        }
        locationMap[loc._id.toString()] = layoutId;
    });

    // Calculate Occupied (Sum of Inventory Volumes)
    allInventory.forEach(inv => {
        if (inv.sku && inv.location) {
            const vol = getVolumeCm3(inv.sku.properties?.dimensions) * inv.quantity;
            const layoutId = locationMap[inv.location.toString()];
            if (layoutId && layoutStats[layoutId]) {
                layoutStats[layoutId].occupied += vol;
            }
        }
    });

    // Compute Percentages
    let totalSystemCapacity = 0;
    let totalSystemOccupied = 0;

    const formatUtilization = (val) => {
        if (val === 0) return 0;
        if (val < 0.01) return parseFloat(val.toFixed(10));
        return parseFloat(val.toFixed(2));
    };

    const layoutUtilization = Object.values(layoutStats).map(stats => {
        totalSystemCapacity += stats.capacity;
        totalSystemOccupied += stats.occupied;

        let util = 0;
        if (stats.capacity > 0) {
            util = (stats.occupied / stats.capacity) * 100;
        }
        return {
            name: stats.name,
            utilization: formatUtilization(Math.min(util, 100))
        };
    });

    let globalUtilization = 0;
    if (totalSystemCapacity > 0) {
        globalUtilization = (totalSystemOccupied / totalSystemCapacity) * 100;
    }
    globalUtilization = formatUtilization(Math.min(globalUtilization, 100));

    // --- Recent Transactions ---
    const recentTransactions = await Transaction.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      totalSkus,
      pendingDispatches,
      activeUsers,
      userRoles,
      layoutUtilization, // Array for Bar Graph
      globalUtilization, // Single value for KPI Card
      recentTransactions,
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// --- NEW FUNCTION ---
// Get detailed utilization stats (Layout -> Location hierarchy)
export const getDetailedUtilization = async (req, res) => {
    try {
        const layouts = await Layout.find({});
        const allLocations = await Location.find({});
        const allInventory = await Inventory.find({}).populate('sku');

        // Helper function to calculate volume in cm³
        const getVolumeCm3 = (dimensions) => {
            return (dimensions?.w || 0) * (dimensions?.d || 0) * (dimensions?.h || 0);
        };

        // 1. Initialize Layout Map
        const layoutMap = {};
        layouts.forEach(l => {
            layoutMap[l._id.toString()] = {
                id: l._id,
                name: l.name,
                capacity: 0,
                occupied: 0,
                locations: []
            };
        });

        // 2. Process Locations
        const locationMap = {}; // Map location ID to its stats object
        allLocations.forEach(loc => {
            const layoutId = loc.layout.toString();
            if (layoutMap[layoutId]) {
                // Location Capacity in cm³ (stored as m³ in DB, so * 1,000,000)
                const capacityCm3 = getVolumeCm3(loc.properties?.dimensions) * 1000000;
                
                const locStats = {
                    id: loc._id,
                    code: loc.locationCode,
                    capacity: capacityCm3,
                    occupied: 0, // Will be filled by inventory
                    utilization: 0
                };

                layoutMap[layoutId].locations.push(locStats);
                layoutMap[layoutId].capacity += capacityCm3;
                locationMap[loc._id.toString()] = locStats;
            }
        });

        // 3. Process Inventory to fill Occupied space
        allInventory.forEach(inv => {
            if (inv.sku && inv.location) {
                const locId = inv.location.toString();
                if (locationMap[locId]) {
                    const skuVol = getVolumeCm3(inv.sku.properties?.dimensions);
                    const totalInvVol = skuVol * inv.quantity;

                    locationMap[locId].occupied += totalInvVol;
                    
                    // Also update parent layout occupied
                    const layoutId = allLocations.find(l => l._id.toString() === locId)?.layout.toString();
                    if (layoutId && layoutMap[layoutId]) {
                        layoutMap[layoutId].occupied += totalInvVol;
                    }
                }
            }
        });

        // 4. Calculate Percentages and Format
        const formatUtil = (occupied, capacity) => {
            if (capacity === 0) return 0;
            const pct = (occupied / capacity) * 100;
            return Math.min(parseFloat(pct.toFixed(2)), 100);
        };

        const result = Object.values(layoutMap).map(layout => {
            // Calculate Layout Utilization
            layout.utilization = formatUtil(layout.occupied, layout.capacity);
            
            // Calculate Location Utilization
            layout.locations.forEach(loc => {
                loc.utilization = formatUtil(loc.occupied, loc.capacity);
                // Add unutilized for convenience
                loc.unutilized = loc.capacity - loc.occupied;
            });

            // Sort locations by code
            layout.locations.sort((a, b) => a.code.localeCompare(b.code));
            
            return layout;
        });

        res.status(200).json(result);

    } catch (error) {
        console.error('Error fetching detailed utilization:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};