import mongoose from 'mongoose';

const layoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a layout name'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Creates a reference to the User model
    },
  },
  {
    timestamps: true,
  }
);

const Layout = mongoose.model('Layout', layoutSchema);

export default Layout;  