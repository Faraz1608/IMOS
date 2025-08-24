import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SKU',
      required: true,
    },
    type: {
      type: String,
      enum: ['GR', 'GI', 'ST'], // Goods Receipt, Goods Issue, Stock Transfer
      required: true,
    },
    quantity: {
      type: Number,
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

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;