import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';

const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();

  if (!token) {
    // If no token exists, redirect to the login page
    return <Navigate to="/login" />;
  }

  return children; // If token exists, render the child component (e.g., DashboardPage)
};

export default ProtectedRoute;  