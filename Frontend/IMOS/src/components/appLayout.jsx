import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { FiGrid, FiPackage, FiLayers, FiBarChart2, FiFileText, FiLogOut, FiUser, FiEye } from 'react-icons/fi';
import NotificationBell from './NotificationBell';

const AppLayout = () => {
  // ... component code remains the same
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
        `flex items-center px-4 py-2.5 text-gray-200 transition-colors duration-200 transform rounded-lg hover:bg-blue-700 ${
          isActive ? 'bg-blue-700 font-bold' : ''
        }`
      }
    >
      {icon}
      <span className="mx-4 font-medium">{children}</span>
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-[#E9EEF7]">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-blue-900 text-white">
        <div className="flex items-center justify-center h-20">
          <h1 className="text-3xl font-bold tracking-wider text-white">IMOS</h1>
        </div>
        <div className="flex flex-col justify-between flex-1 mt-4">
          <nav className="space-y-2 px-4">
            <NavItem to="/dashboard" icon={<FiGrid />}>Dashboard</NavItem>
            <NavItem to="/skus" icon={<FiPackage />}>Products/SKUs</NavItem>
            <NavItem to="/layouts" icon={<FiLayers />}>Locations</NavItem>
            <NavItem to="/inventory" icon={<FiEye />}>Inventory View</NavItem>
            <NavItem to="/optimizations" icon={<FiBarChart2 />}>ICC Optimization</NavItem>
            <NavItem to="/reports" icon={<FiFileText />}>Reports</NavItem>
          </nav>
          <nav className="px-4 pb-4">
            {/* */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 text-gray-200 transition-colors duration-200 transform rounded-lg hover:bg-blue-700"
            >
              <FiLogOut />
              <span className="mx-4 font-medium">Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="flex items-center justify-end h-20 px-10 flex-shrink-0">
          <div className="flex items-center">
            
            <div className="flex items-center ml-6">
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-800">{user?.username || "manager_a@company.com"}</p>
              </div>
               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ml-2">
                 <FiUser className="w-6 h-6 text-gray-700" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 pt-0 overflow-hidden">
           <div className="bg-white p-8 rounded-2xl shadow-lg h-full w-full overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};


export default AppLayout; // This line ensures the component is exported correctly.