import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { FiMail, FiLock } from 'react-icons/fi';
import PasswordInput from '../components/PasswordInput';

const ImosLogo = () => (
  <svg height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12L24 4L44 12V36L24 44L4 36V12Z" stroke="#1E40AF" strokeWidth="4" strokeLinejoin="round" />
    <path d="M4 12L24 20L44 12" stroke="#1E40AF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 44V20" stroke="#1E40AF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      toast.success(t('login.success'));
      navigate('/dashboard');

    } catch (error) {
      console.error('Login failed:', error.response?.data);
      toast.error(t('login.fail'));
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1576185244583-53699c2b48b1?auto=format&fit=crop&w=1920&q=80')" }}
    >
      <div className="w-full max-w-sm p-8 space-y-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl">
        <div className="text-center">
          <div className="flex justify-center items-center gap-3 mb-2">
            <ImosLogo />
            <h1 className="text-4xl font-bold text-blue-900">IMOS</h1>
          </div>
          <p className="text-gray-600">{t('login.subtitle')}</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <FiMail className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              id="email" name="email" type="email" required
              placeholder={t('login.email_placeholder')}
              className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={formData.email} onChange={handleChange}
            />
          </div>
          <PasswordInput
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={t('login.password_placeholder')}
            leftIcon={<FiLock />}
          />
          <div className="flex items-center">
            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">{t('login.remember_me')}</label>
          </div>
          <div>
            <button type="submit" className="w-full py-3 px-4 text-sm font-semibold rounded-lg text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              {t('login.submit')}
            </button>
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {t('login.no_account')}{' '}
              <span
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                {t('login.signup')}
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;