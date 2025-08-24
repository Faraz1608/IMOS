import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.js';
import { getLayouts } from '../services/layoutService.js';
import { getLayoutStats } from '../services/optimizationService.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState([]);
  const { token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const layoutsRes = await getLayouts(token);
        const statsPromises = layoutsRes.data.map(layout => getLayoutStats(layout._id, token));
        const statsResults = await Promise.all(statsPromises);
        
        // Process data for the chart
        const chartData = statsResults.map(res => ({
          layoutName: res.data.layoutName,
          // Extract the number from the percentage string
          spaceUtilization: parseFloat(res.data.spaceUtilization.replace('%', '')), 
          occupiedLocations: res.data.occupiedLocations,
          totalLocations: res.data.totalLocations,
        }));
        setStats(chartData);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchAllStats();
  }, [token]);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.username}!</h1>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Logout
        </button>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Layout Space Utilization (%)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="layoutName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="spaceUtilization" name="Space Utilization" fill="#8884d8" unit="%" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardPage;