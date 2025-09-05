import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.js';
import { getDashboardStats } from '../services/dashboardService.js';
import StatCard from '../components/StatCard.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FiPackage, FiTruck } from 'react-icons/fi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DashboardPage = () => {
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

  const roleData = stats?.userRoles?.map(role => ({ name: role._id, value: role.count })) || [];
  const transactionData = stats?.recentTransactions?.map(t => ({ name: t._id, value: t.count })) || [];
  const inventoryStatus = stats?.inventoryStatus || [];


  return (
    <div className="space-y-6">
      {/* KPI & Role Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<FiPackage className="w-6 h-6 text-blue-800" />}
          title="Total SKU's" 
          value={stats?.totalSkus ?? 0}
          colorClass="bg-blue-200"
        />
        <StatCard 
          icon={<FiTruck className="w-6 h-6 text-orange-800" />}
          title="Pending Dispatches" 
          value={stats?.pendingDispatches ?? 0}
          colorClass="bg-orange-200"
        />
        <div className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-500 font-medium">Role Distribution</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.activeUsers ?? 0} Active Users</p>
            </div>
            {/* Removed the unnecessary ResponsiveContainer */}
            <PieChart width={100} height={100}>
                <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={40} >
                    {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
            </PieChart>
        </div>
      </div>
      
      {/* Layout Utilization & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
           <h2 className="text-xl font-semibold mb-4 text-gray-700">Layout Space Utilization</h2>
           <ResponsiveContainer width="100%" height={250}>
             <BarChart data={stats?.layoutUtilization}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} />
               <XAxis dataKey="name" />
               <YAxis unit="%" />
               <Tooltip />
               <Bar dataKey="utilization" name="Utilization" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
             </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Transactions</h2>
            <div className="flex-grow flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                        <Pie data={transactionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                            {transactionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Inventory Status Table */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Inventory Status</h2>
        <table className="min-w-full">
            <thead>
                <tr className="border-b">
                    <th className="text-left py-2 px-4 text-gray-500 font-medium">SKU's</th>
                    <th className="text-left py-2 px-4 text-gray-500 font-medium">Dispatch Status</th>
                    <th className="text-left py-2 px-4 text-gray-500 font-medium">Approvals</th>
                </tr>
            </thead>
            <tbody>
                {inventoryStatus.map((item) => (
                    <tr key={item._id} className="border-b">
                        <td className="py-3 px-4">{item.items.map(i => i.sku.name).join(', ')}</td>
                        <td className="py-3 px-4">{item.status}</td>
                        <td className="py-3 px-4">{item.approvedBy || 'N/A'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;