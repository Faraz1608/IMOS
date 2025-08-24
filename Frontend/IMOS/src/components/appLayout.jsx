import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { FiGrid, FiPackage, FiMapPin, FiLayers, FiBarChart2, FiFileText, FiSettings, FiLogOut, FiBell, FiSearch } from 'react-icons/fi';

const AppLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon, children }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-gray-200 transition-colors duration-200 transform rounded-lg hover:bg-emerald-700 ${
          isActive ? 'bg-emerald-700' : ''
        }`
      }
    >
      {icon}
      <span className="mx-4 font-medium">{children}</span>
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-emerald-800 text-white">
        <div className="flex items-center justify-center h-20 border-b border-emerald-700">
          <h1 className="text-2xl font-bold">IMOS</h1>
        </div>
        <div className="flex flex-col justify-between flex-1 mt-6">
          <nav>
            <NavItem to="/dashboard" icon={<FiGrid />}>Dashboard</NavItem>
            <NavItem to="/skus" icon={<FiPackage />}>Products/SKUs</NavItem>
            <NavItem to="/layouts" icon={<FiLayers />}>Layouts</NavItem>
            <NavItem to="/inventory" icon={<FiLayers />}>Set Inventory</NavItem>
            <NavItem to="/optimizations" icon={<FiBarChart2 />}>ICC Optimization</NavItem>
            <NavItem to="/reports" icon={<FiFileText />}>Reports</NavItem>
          </nav>
          <nav>
            <NavItem to="/settings" icon={<FiSettings />}>Settings</NavItem>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-200 transition-colors duration-200 transform rounded-lg hover:bg-emerald-700"
            >
              <FiLogOut />
              <span className="mx-4 font-medium">Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-20 px-6 py-4 bg-white border-b">
          <div className="flex items-center">
            <FiSearch className="w-5 h-5 text-gray-500" />
            <input
              className="relative w-full px-4 py-2 pl-10 text-sm text-gray-700 bg-white border border-gray-200 rounded-md focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 focus:outline-none focus:ring"
              type="text"
              placeholder="Search"
            />
          </div>
          <div className="flex items-center">
            <FiBell className="w-6 h-6 text-gray-600 cursor-pointer" />
            <div className="flex items-center ml-6">
              <img
                className="w-10 h-10 rounded-full object-cover"
                src={`https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=c7d2fe&color=3730a3`}
                alt="avatar"
              />
              <div className="ml-2">
                <p className="text-sm font-semibold">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;