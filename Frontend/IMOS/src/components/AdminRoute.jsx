import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();

  if (user && user.role === 'ADMIN') {
    return children; // If user is an Admin, render the child component
  }

  // If not an admin, redirect to the dashboard
  return <Navigate to="/dashboard" />;
};

export default AdminRoute;