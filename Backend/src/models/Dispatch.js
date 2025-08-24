import mongoose from 'mongoose';

const dispatchSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        sku: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SKU',
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ['Pending Dispatch', 'In Queue', 'Dispatched', 'Failed'],
      default: 'Pending Dispatch',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Dispatch = mongoose.model('Dispatch', dispatchSchema);
export default Dispatch;