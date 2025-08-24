import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.js';
import { getDashboardStats } from '../services/dashboardService.js';
import StatCard from '../components/StatCard.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FiPackage, FiTruck, FiUsers } from 'react-icons/fi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DashboardPage = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats(token);
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={<FiPackage className="w-6 h-6 text-white" />}
          title="Total SKU's" 
          value={stats?.totalSkus ?? 0}
          colorClass="bg-blue-500"
        />
        <StatCard 
          icon={<FiTruck className="w-6 h-6 text-white" />}
          title="Pending Dispatches" 
          value={stats?.pendingDispatches ?? 0}
          colorClass="bg-orange-500"
        />
        <StatCard 
          icon={<FiUsers className="w-6 h-6 text-white" />}
          title="Active Users" 
          value={stats?.activeUsers ?? 0}
          colorClass="bg-teal-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg">
           <h2 className="text-xl font-semibold mb-4 text-gray-700">Layout Space Utilization</h2>
           <ResponsiveContainer width="100%" height={300}>
             <BarChart data={stats?.layoutUtilization}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="name" />
               <YAxis unit="%" />
               <Tooltip />
               <Bar dataKey="utilization" name="Utilization" fill="#4f46e5" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Role Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats?.userRoles} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="count" nameKey="_id">
                {stats?.userRoles?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Placeholder for future tables */}
    </div>
  );
};

export default DashboardPage;