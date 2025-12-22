import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore.js';
import { getDashboardStats } from '../services/dashboardService.js';
import StatCard from '../components/StatCard.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FiPackage, FiHome, FiUsers, FiLayers, FiTool } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

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
    return <div className="text-center p-10">{t('dashboard.loading')}</div>;
  }

  const roleData = stats?.userRoles?.map(role => ({ name: role._id, value: role.count })) || [];


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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<FiHome className="w-6 h-6 text-purple-800" />}
          title={t('dashboard.warehouse_utilization')}
          value={`${stats?.globalUtilization ?? 0}%`}
          colorClass="bg-purple-200"
        />
        <StatCard
          icon={<FiPackage className="w-6 h-6 text-blue-800" />}
          title={t('dashboard.total_skus')}
          value={stats?.totalSkus ?? 0}
          colorClass="bg-blue-200"
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
          <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('dashboard.layout_utilization_title')}</h2>
          <div className="overflow-x-auto h-96">
            <ResponsiveContainer width="100%" height={300} minWidth={layoutChartMinWidth > 600 ? layoutChartMinWidth : '100%'}>
              <BarChart data={sortedLayoutData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={utilizationTooltipFormatter} />
                <Bar dataKey="utilization" name={t('dashboard.utilization')} fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {sortedLayoutData.length === 0 && (
            <p className="text-center text-gray-400 mt-4">{t('dashboard.no_layout_data')}</p>
          )}
        </div>

        {/* Inventory Categories Buttons */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('dashboard.quick_access')}</h2>
          <div className="flex flex-col gap-4 justify-center flex-grow">
            <button
              onClick={() => navigate('/inventory?category=Raw Material')}
              className="flex items-center p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
            >
              <div className="p-3 bg-blue-200 rounded-full mr-4">
                <FiLayers className="w-6 h-6" />
              </div>
              <span className="font-medium text-lg">{t('sku.categories.raw')}</span>
            </button>
            <button
              onClick={() => navigate('/inventory?category=Finished Product')}
              className="flex items-center p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors shadow-sm"
            >
              <div className="p-3 bg-green-200 rounded-full mr-4">
                <FiPackage className="w-6 h-6" />
              </div>
              <span className="font-medium text-lg">{t('sku.categories.finished')}</span>
            </button>
            <button
              onClick={() => navigate('/inventory?category=Work In Progress')}
              className="flex items-center p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors shadow-sm"
            >
              <div className="p-3 bg-orange-200 rounded-full mr-4">
                <FiTool className="w-6 h-6" />
              </div>
              <span className="font-medium text-lg">{t('sku.categories.wip')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;