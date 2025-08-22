import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 text-xl font-bold">IMOS</div>
        <nav className="mt-5">
          <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">Dashboard</Link>
          <Link to="/layouts" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">Layouts</Link>
          <Link to="/skus" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">SKUs</Link>
          <Link to="/inventory" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">Inventory</Link>
          <Link to="/inventory/view" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">View Inventory</Link>
          <Link to="/optimizations" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">Optimizations</Link>
          <Link to="/search" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">Search</Link>
        </nav>
      </div>
      <main className="flex-1 p-6">
        <Outlet /> {/* Child routes will render here */}
      </main>
    </div>
  );
};

export default AppLayout;