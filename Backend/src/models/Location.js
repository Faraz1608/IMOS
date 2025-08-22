import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    layout: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Layout',
    },
    locationCode: {
      type: String,
      required: [true, 'Please add a location code (e.g., A01-R02-S03)'],
      trim: true,
    },
    properties: {
      dimensions: {
        w: { type: Number },
        d: { type: Number },
        h: { type: Number },
      },
      weightCapacityKg: { type: Number },
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

// Prevent duplicate location codes within the same layout
locationSchema.index({ layout: 1, locationCode: 1 }, { unique: true });

const Location = mongoose.model('Location', locationSchema);

export default Location;