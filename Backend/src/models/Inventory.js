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

// An SKU can only exist in one location once.
inventorySchema.index({ sku: 1, location: 1 }, { unique: true });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;