import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';

// A simple logo component
const ImosLogo = () => (
  <svg height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12L24 4L44 12V36L24 44L4 36V12Z" stroke="#4F46E5" strokeWidth="4" strokeLinejoin="round"/>
    <path d="M4 12L24 20L44 12" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24 44V20" stroke="#4F46E5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('Operator'); // Default role

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
      toast.success('Login successful!');
      navigate('/dashboard');

    } catch (error) {
      console.error('Login failed:', error.response?.data);
      toast.error('Login failed! Please check your credentials.');
    }
  };

  const RoleButton = ({ role }) => (
    <button
      type="button"
      onClick={() => setSelectedRole(role)}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
        selectedRole === role
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {role}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="flex rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden">
        {/* Left Side - Image */}
        <div className="hidden md:block md:w-1/2">
          <img 
            src="https://images.unsplash.com/photo-1576185244583-53699c2b48b1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80" 
            alt="Warehouse worker" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
            <ImosLogo />
            <h1 className="text-3xl font-bold text-gray-900">IMOS</h1>
          </div>
          <p className="text-gray-600 mb-8">Sign in to your account</p>

          <div className="flex space-x-4 mb-8">
            <RoleButton role="Operator" />
            <RoleButton role="Manager" />
            <RoleButton role="Admin" />
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input id="email" name="email" type="email" required className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input id="password" name="password" type="password" required className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" value={formData.password} onChange={handleChange} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Remember Me</label>
              </div>
            </div>
            <div>
              <button type="submit" className="w-full py-3 px-4 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Sign in as {selectedRole}
              </button>
            </div>
          </form>
          <p className="mt-8 text-sm text-center text-gray-600">
            No account? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;