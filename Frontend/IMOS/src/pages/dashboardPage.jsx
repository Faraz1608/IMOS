import React, { useState, useEffect, useCallback } from 'react';
import useAuthStore from '../store/authStore.js';
import { getDashboardStats } from '../services/dashboardService.js';
import StatCard from '../components/StatCard.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { FiPackage, FiTruck, FiDollarSign, FiAlertTriangle, FiTrendingUp, FiActivity, FiWifi, FiWifiOff, FiRefreshCw } from 'react-icons/fi';
import { useSocket, useDashboardUpdates, useInventoryUpdates, useAlertUpdates, useOnlineUsers } from '../hooks/useSocket.js';
import RealTimeTest from '../components/RealTimeTest.jsx';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const { token } = useAuthStore();
  
  // Real-time socket connection
  const { isConnected, requestDataUpdate } = useSocket();
  const { userCount, onlineUsers } = useOnlineUsers();

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats(token);
      setStats(res.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial data fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time update handlers
  const handleDashboardUpdate = useCallback((data) => {
    console.log('📊 Dashboard update received:', data);
    if (data.stats) {
      setStats(data.stats);
      setLastUpdated(new Date());
      toast.success('📊 Dashboard data updated');
    }
  }, []);

  const handleInventoryUpdate = useCallback(() => {
    console.log('📦 Inventory updated - refreshing dashboard');
    fetchStats();
  }, [fetchStats]);

  const handleAlertUpdate = useCallback((data) => {
    console.log('🚨 Alert updated - refreshing dashboard');
    if (data.action === 'create' || data.action === 'resolve') {
      fetchStats();
    }
  }, [fetchStats]);

  // Set up real-time listeners
  useDashboardUpdates(handleDashboardUpdate);
  useInventoryUpdates(handleInventoryUpdate);
  useAlertUpdates(handleAlertUpdate);

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    toast.loading('Refreshing dashboard...', { id: 'dashboard-refresh' });
    fetchStats().then(() => {
      toast.success('Dashboard refreshed!', { id: 'dashboard-refresh' });
    }).catch(() => {
      toast.error('Failed to refresh dashboard', { id: 'dashboard-refresh' });
    });
  }, [fetchStats]);

  if (loading) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  const roleData = stats?.userRoles?.map(role => ({ name: role._id, value: role.count })) || [];
  const transactionData = stats?.recentTransactions?.map(t => ({ name: t._id, value: t.count })) || [];
  const inventoryStatus = stats?.inventoryStatus || [];


  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <FiWifi className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Live Updates</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </>
              ) : (
                <>
                  <FiWifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-600">Offline</span>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </>
              )}
            </div>
            
            {userCount > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">{userCount} users online</span>
                <div className="flex -space-x-1">
                  {onlineUsers.slice(0, 3).map((user, index) => (
                    <div key={user.userId} className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white"
                         title={user.name}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {onlineUsers.length > 3 && (
                    <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white">
                      +{onlineUsers.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Last updated</p>
              <p className="text-sm font-medium">{lastUpdated.toLocaleTimeString()}</p>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>
      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          icon={<FiPackage className="w-6 h-6 text-blue-800" />}
          title="Total SKUs" 
          value={stats?.totalSkus ?? 0}
          colorClass="bg-blue-200"
          subtitle="Products"
        />
        <StatCard 
          icon={<FiTruck className="w-6 h-6 text-orange-800" />}
          title="Pending Dispatches" 
          value={stats?.pendingDispatches ?? 0}
          colorClass="bg-orange-200"
          subtitle="Orders"
        />
        <StatCard 
          icon={<FiDollarSign className="w-6 h-6 text-green-800" />}
          title="Total Inventory" 
          value={stats?.totalInventoryValue ?? 0}
          colorClass="bg-green-200"
          subtitle="Units"
        />
        <StatCard 
          icon={<FiAlertTriangle className="w-6 h-6 text-red-800" />}
          title="Low Stock Alerts" 
          value={stats?.lowStockAlerts ?? 0}
          colorClass="bg-red-200"
          subtitle="Items"
        />
        <div className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center">
            <div>
                <p className="text-sm text-gray-500 font-medium">Active Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats?.activeUsers ?? 0}</p>
                <p className="text-xs text-gray-400">System Users</p>
            </div>
            <PieChart width={80} height={80}>
                <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={35} >
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

      {/* Transaction Trends */}
      {stats?.transactionTrends && stats.transactionTrends.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Transaction Trends (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.transactionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="totalCount" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* SKU Velocity Analysis & Top Moving SKUs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">SKU Velocity Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats?.velocityAnalysis}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Moving SKUs */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Top Moving SKUs (30 days)</h2>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {stats?.topMovingSKUs?.slice(0, 5).map((sku, index) => (
              <div key={sku._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-200 text-yellow-800' :
                    index === 1 ? 'bg-gray-200 text-gray-800' :
                    index === 2 ? 'bg-orange-200 text-orange-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{sku.skuCode}</p>
                    <p className="text-xs text-gray-500">{sku.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{sku.totalMovement}</p>
                  <p className="text-xs text-gray-500">{sku.velocity} velocity</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Volume & Recent Dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Transaction Volume */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Monthly Transaction Volume</h2>
          {stats?.monthlyVolume && stats.monthlyVolume.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.monthlyVolume}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                />
                <Area type="monotone" dataKey="totalQuantity" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <FiActivity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No transaction data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Dispatches */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Recent Dispatches</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {inventoryStatus?.map((dispatch) => (
              <div key={dispatch._id} className="border-l-4 border-blue-500 pl-3 py-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    dispatch.status === 'Pending Dispatch' ? 'bg-yellow-100 text-yellow-800' :
                    dispatch.status === 'In Queue' ? 'bg-blue-100 text-blue-800' :
                    dispatch.status === 'Dispatched' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {dispatch.status}
                  </span>
                  <FiTrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-sm font-medium mt-1">
                  {dispatch.items?.length ? `${dispatch.items.length} items` : 'No items'}
                </p>
                <p className="text-xs text-gray-500">
                  {dispatch.approvedBy ? `Approved by ${dispatch.approvedBy.username}` : 'Pending approval'}
                </p>
              </div>
            )) || (
              <div className="text-center text-gray-500 py-8">
                <FiTruck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent dispatches</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Real-Time Testing Component */}
      <div className="mt-6">
        <RealTimeTest />
      </div>
    </div>
  );
};

export default DashboardPage;