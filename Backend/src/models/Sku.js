import mongoose from 'mongoose';

const skuSchema = new mongoose.Schema(
  {
    skuCode: {
      type: String,
      required: [true, 'Please add an SKU code'],
      trim: true,
      unique: true, // SKU codes must be unique across the entire system
    },
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    description: {
      type: String,
    },
    properties: {
      dimensions: {
        w: { type: Number },
        d: { type: Number },
        h: { type: Number },
      },
      weightKg: { type: Number },
    },
    velocity: {
      type: String,
      enum: ['A', 'B', 'C', 'N/A'], // A=Fast, B=Medium, C=Slow, N/A=Not Classified
      default: 'N/A',
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

const SKU = mongoose.model('SKU', skuSchema);

export default SKU;