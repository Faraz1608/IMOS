import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.js';
import { getDashboardStats } from '../services/dashboardService.js';
import StatCard from '../components/StatCard.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FiPackage, FiTruck, FiHome, FiUsers } from 'react-icons/fi';

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
  
  // Sort layout data for the chart
  const sortedLayoutData = stats?.layoutUtilization
      ? [...stats.layoutUtilization].sort((a, b) => a.name.localeCompare(b.name))
      : [];

  const utilizationTooltipFormatter = (value) => `${value}%`;

  // Calculate min width for the scrolling chart
  const layoutChartMinWidth = (sortedLayoutData.length || 0) * 100;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<FiHome className="w-6 h-6 text-purple-800" />}
          title="Warehouse Utilization" 
          value={`${stats?.globalUtilization ?? 0}%`}
          colorClass="bg-purple-200"
        />
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
         <div className="bg-white p-4 rounded-xl shadow-lg flex flex-col justify-between items-center relative overflow-hidden">
            <div className="w-full flex justify-between items-center z-10">
                 <div>
                    <p className="text-sm text-gray-500 font-medium">Active Users</p>
                    <p className="text-2xl font-bold text-gray-800">{stats?.activeUsers ?? 0}</p>
                 </div>
                 <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                    <FiUsers className="w-6 h-6" />
                 </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={0} outerRadius={40}>
                            {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layout Utilization Bar Graph */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
           <h2 className="text-xl font-semibold mb-4 text-gray-700">Layout Space Utilization (Max 100%)</h2>
           <div className="overflow-x-auto">
             <ResponsiveContainer width="100%" height={300} minWidth={layoutChartMinWidth > 600 ? layoutChartMinWidth : '100%'}>
               <BarChart data={sortedLayoutData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" />
                 <YAxis unit="%" domain={[0, 100]} />
                 <Tooltip formatter={utilizationTooltipFormatter} />
                 <Bar dataKey="utilization" name="Utilization" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={50} />
               </BarChart>
             </ResponsiveContainer>
           </div>
           {sortedLayoutData.length === 0 && (
             <p className="text-center text-gray-400 mt-4">No layout data available</p>
           )}
        </div>

        {/* Recent Transactions Pie Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md flex flex-col">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Transactions</h2>
            <div className="flex-grow flex items-center justify-center min-h-[250px]">
                {transactionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={transactionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                              {transactionData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400">No transactions recorded</p>
                )}
            </div>
        </div>
      </div>      
    </div>
  );
};

export default DashboardPage;