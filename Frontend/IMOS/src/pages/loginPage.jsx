import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Import toast
import api from '../services/api';
import useAuthStore from '../store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', formData);
      const { token } = response.data;
      const userResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      login(token, userResponse.data);
      toast.success('Login successful!'); // Replace alert with toast
      navigate('/dashboard');

    } catch (error) {
      console.error('Login failed:', error.response?.data);
      toast.error('Login failed! Please check your credentials.'); // Replace alert with toast
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          IMOS Login
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* ... form inputs ... */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <input id="email" name="email" type="email" required className="w-full px-3 py-2 mt-1 border rounded-md" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" type="password" required className="w-full px-3 py-2 mt-1 border rounded-md" value={formData.password} onChange={handleChange} />
          </div>
          <div>
            <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700">Sign in</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;