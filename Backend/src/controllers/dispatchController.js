import Dispatch from '../models/Dispatch.js';
import Notification from '../models/Notification.js';
import { createAndEmitNotification } from '../utils/notificationUtils.js';

// @desc    Create a new dispatch order
// @route   POST /api/dispatches
export const createDispatch = async (req, res) => {
  try {
    const { orderId, items } = req.body;
    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order ID and at least one item are required.' });
    }

    const dispatch = new Dispatch({
      orderId,
      items,
      approvedBy: req.user.id,
    });
    await dispatch.save();

    // --- Create and Emit Notification ---
    await createAndEmitNotification(req.io, {
      user: req.user.id,
      message: `New dispatch order created: ${orderId}`,
      link: `/dispatches`,
    });

    res.status(201).json(dispatch);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Order ID already exists.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all dispatch orders
// @route   GET /api/dispatches
export const getDispatches = async (req, res) => {
  try {
    const dispatches = await Dispatch.find({})
      .populate('items.sku', 'skuCode name')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 });

    // FIX: Filter out any dispatches that have missing/deleted SKU references
    const filteredDispatches = dispatches.filter(dispatch =>
      dispatch.items.every(item => item.sku)
    );

    res.status(200).json(filteredDispatches);
  } catch (error) {
    console.error('Error fetching dispatches:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a dispatch order's status
// @route   PUT /api/dispatches/:id/status
export const updateDispatchStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const dispatch = await Dispatch.findById(req.params.id);

    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch not found.' });
    }
    dispatch.status = status;
    await dispatch.save();

    // --- Create and Emit Notification ---
    await createAndEmitNotification(req.io, {
      user: req.user.id,
      message: `Dispatch ${dispatch.orderId} status updated to: ${status}`,
      link: `/dispatches`,
    });

    res.status(200).json(dispatch);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};