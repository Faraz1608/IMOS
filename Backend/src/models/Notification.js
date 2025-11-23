import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Changed to false for global notifications
      ref: 'User',
    },
    message: {
      type: String,
      required: true,
    },
    link: { // Optional: A URL to navigate to when the notification is clicked
      type: String, 
    },
    read: {
      type: Boolean,
      default: false,
    },
    deletedBy: [{ // Array of users who have deleted this global notification
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;