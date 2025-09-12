import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'SKU',
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Location',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    // --- NEW FIELDS ---
    batchNumber: {
      type: String,
      trim: true,
      default: null, // Default to null if not provided
    },
    serialNumber: {
      type: String,
      trim: true,
      default: null, // Default to null if not provided
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// --- UPDATED INDEX ---
// This new unique index allows for granular tracking. An item is now unique
// based on the combination of SKU, location, batch, and serial number.
inventorySchema.index({ sku: 1, location: 1, batchNumber: 1, serialNumber: 1 }, { unique: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
