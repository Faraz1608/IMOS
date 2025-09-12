import mongoose from 'mongoose';

const inventoryMovementSchema = new mongoose.Schema(
  {
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SKU',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['GR', 'GI', 'ST'], // Goods Receipt, Goods Issue, Stock Transfer
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
export default InventoryMovement;