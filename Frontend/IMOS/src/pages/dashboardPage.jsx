import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.js';
import { getLayouts } from '../services/layoutService.js';
import { getLayoutStats } from '../services/optimizationService.js'; // We'll create this service next
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState([]);
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const layoutsRes = await getLayouts(token);
        const statsPromises = layoutsRes.data.map(layout => getLayoutStats(layout._id, token));
        const statsResults = await Promise.all(statsPromises);
        setStats(statsResults.map(res => res.data));
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchAllStats();
  }, [token]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.email}!</h1>
        <button onClick={logout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Logout
        </button>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Layout Space Utilization</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="layoutName" />
            <YAxis unit="%" />
            <Tooltip />
            <Legend />
            <Bar dataKey="occupiedLocations" name="Occupied Locations" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardPage;