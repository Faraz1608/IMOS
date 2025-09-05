import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.js';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';
import { 
  FiTrendingUp, FiTrendingDown, FiAlertTriangle, FiTarget, 
  FiActivity, FiDownload, FiRefreshCw, FiPackage, 
  FiClock, FiDollarSign, FiBarChart2
} from 'react-icons/fi';
import { LuBrainCircuit } from 'react-icons/lu'; // Corrected Icon Import
import axios from 'axios';
import { toast } from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const AdvancedAnalyticsPage = () => {
  const [predictiveData, setPredictiveData] = useState(null);
  const [turnoverData, setTurnoverData] = useState(null);
  const [spaceData, setSpaceData] = useState(null);
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('predictive');
  const [refreshing, setRefreshing] = useState(false);
  
  const { token } = useAuthStore();

  useEffect(() => {
    fetchAnalyticsData();
  }, [token]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [predictive, turnover, space, cost] = await Promise.allSettled([
        axios.get('/api/advanced-analytics/predictive', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/advanced-analytics/turnover', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/advanced-analytics/space-utilization', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/advanced-analytics/cost-analysis', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (predictive.status === 'fulfilled') setPredictiveData(predictive.value.data);
      if (turnover.status === 'fulfilled') setTurnoverData(turnover.value.data);
      if (space.status === 'fulfilled') setSpaceData(space.value.data);
      if (cost.status === 'fulfilled') setCostData(cost.value.data);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  const exportData = async (reportType) => {
    try {
      const response = await axios.post('/api/advanced-analytics/export', {
        reportType,
        dateRange: { start: new Date().toISOString(), end: new Date().toISOString() },
        format: 'json'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LuBrainCircuit className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" /> {/* Corrected Icon */}
          <p className="text-gray-500">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  const MetricCard = ({ title, value, icon, trend, trendValue, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full bg-${color}-100`}>
            {icon}
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend === 'up' ? <FiTrendingUp className="w-4 h-4" /> : <FiTrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
            <LuBrainCircuit className="w-8 h-8 text-blue-600" /> {/* Corrected Icon */}
            <span>Advanced Analytics</span>
          </h1>
          <p className="text-gray-600 mt-1">Predictive insights and detailed performance analysis</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => exportData('analytics')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 bg-gray-50 p-4 rounded-xl">
        {/* Corrected Icon */}
      <TabButton // <--- Corrected name
        id="predictive"
        label="Predictive Analytics"
        icon={<LuBrainCircuit className="w-4 h-4" />}
        isActive={activeTab === 'predictive'}
        onClick={setActiveTab}
    />
        <TabButton
          id="turnover"
          label="Inventory Turnover"
          icon={<FiActivity className="w-4 h-4" />}
          isActive={activeTab === 'turnover'}
          onClick={setActiveTab}
        />
        {/* Corrected Icon */}
<TabButton
  id="space"
  label="Space Utilization"
  icon={<FiBarChart2 className="w-4 h-4" />}
  isActive={activeTab === 'space'}
  onClick={setActiveTab}
/>
        <TabButton
          id="cost"
          label="Cost Analysis"
          icon={<FiDollarSign className="w-4 h-4" />}
          isActive={activeTab === 'cost'}
          onClick={setActiveTab}
        />
      </div>

      {/* Content based on active tab */}
      {activeTab === 'predictive' && predictiveData && (
        <div className="space-y-6">
          {/* Demand Forecast */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center space-x-2">
              <FiTarget className="w-5 h-5" />
              <span>Demand Forecast (Next 4 Weeks)</span>
            </h2>
            {predictiveData.demandForecast?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictiveData.demandForecast.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="skuCode" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'forecastedDemand' ? 'Forecasted Demand' : name]}
                    labelFormatter={(label) => `SKU: ${label}`}
                  />
                  <Bar dataKey="forecastedDemand" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FiTarget className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No forecast data available</p>
              </div>
            )}
          </div>

          {/* ABC Analysis */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Enhanced ABC Analysis</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 text-gray-500 font-medium">SKU Code</th>
                    <th className="text-left py-2 px-4 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-2 px-4 text-gray-500 font-medium">Current Class</th>
                    <th className="text-left py-2 px-4 text-gray-500 font-medium">Suggested Class</th>
                    <th className="text-left py-2 px-4 text-gray-500 font-medium">Movement Score</th>
                    <th className="text-left py-2 px-4 text-gray-500 font-medium">Action Required</th>
                  </tr>
                </thead>
                <tbody>
                  {predictiveData.abcAnalysisData?.slice(0, 10).map((item) => (
                    <tr key={item._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{item.skuCode}</td>
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.currentClass === 'A' ? 'bg-green-100 text-green-800' :
                          item.currentClass === 'B' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Class {item.currentClass}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.suggestedClass === 'A' ? 'bg-green-100 text-green-800' :
                          item.suggestedClass === 'B' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Class {item.suggestedClass}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{item.movementScore?.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {item.needsReclassification ? (
                          <span className="flex items-center space-x-1 text-orange-600">
                            <FiAlertTriangle className="w-4 h-4" />
                            <span className="text-sm">Reclassify</span>
                          </span>
                        ) : (
                          <span className="text-green-600 text-sm">✓ Correct</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stockout Prediction */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center space-x-2">
              <FiAlertTriangle className="w-5 h-5 text-red-500" />
              <span>Stockout Risk Analysis</span>
            </h2>
            {predictiveData.stockoutPrediction?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictiveData.stockoutPrediction.slice(0, 9).map((item) => (
                  <div key={item._id} className={`p-4 rounded-lg border-l-4 ${
                    item.riskLevel === 'Critical' ? 'border-red-500 bg-red-50' :
                    item.riskLevel === 'High' ? 'border-orange-500 bg-orange-50' :
                    item.riskLevel === 'Medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-green-500 bg-green-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.riskLevel === 'Critical' ? 'bg-red-200 text-red-800' :
                        item.riskLevel === 'High' ? 'bg-orange-200 text-orange-800' :
                        item.riskLevel === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {item.riskLevel} Risk
                      </span>
                      <FiClock className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="font-medium text-sm mb-1">{item.skuCode}</p>
                    <p className="text-xs text-gray-600 mb-2">{item.name}</p>
                    <div className="flex justify-between text-sm">
                      <span>Stock: {item.currentStock}</span>
                      <span>{Math.round(item.daysToStockout)} days</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <FiPackage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No stockout risks detected</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'turnover' && turnoverData && (
        <div className="space-y-6">
          {/* Turnover Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Average Turnover Ratio"
              value={turnoverData.turnoverData?.length > 0 ? 
                (turnoverData.turnoverData.reduce((acc, item) => acc + item.turnoverRatio, 0) / turnoverData.turnoverData.length).toFixed(2) : '0'
              }
              icon={<FiActivity className="w-6 h-6 text-blue-600" />}
              color="blue"
            />
            <MetricCard
              title="Fast Moving Items"
              value={turnoverData.fastMovingItems?.length || 0}
              icon={<FiTrendingUp className="w-6 h-6 text-green-600" />}
              color="green"
            />
            <MetricCard
              title="Slow Moving Items"
              value={turnoverData.slowMovingItems?.length || 0}
              icon={<FiTrendingDown className="w-6 h-6 text-red-600" />}
              color="red"
            />
          </div>

          {/* Turnover Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Inventory Turnover Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={turnoverData.turnoverData?.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="skuCode" angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="currentStock" fill="#e5e7eb" name="Current Stock" />
                <Line yAxisId="right" type="monotone" dataKey="turnoverRatio" stroke="#3b82f6" strokeWidth={2} name="Turnover Ratio" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Fast vs Slow Moving Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 text-green-600">Fast Moving Items</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {turnoverData.fastMovingItems?.slice(0, 8).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.skuCode}</p>
                      <p className="text-xs text-gray-600">{item.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-green-600">{item.totalMovement}</p>
                      <p className="text-xs text-gray-500">{item.dailyAverage?.toFixed(1)}/day</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 text-red-600">Slow Moving Items</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {turnoverData.slowMovingItems?.slice(0, 8).map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.skuCode}</p>
                      <p className="text-xs text-gray-600">{item.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-red-600">{item.currentStock}</p>
                      <p className="text-xs text-gray-500">{item.recentTransactions} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder content for other tabs */}
      {activeTab === 'space' && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Space Utilization Analysis</h2>
          <div className="text-center text-gray-500 py-12">
            <FiBarChart2 className="w-16 h-16 mx-auto mb-4 opacity-50" /> {/* Corrected Icon */}
            <p className="text-lg mb-2">Space Utilization Analytics</p>
            <p>Detailed space utilization metrics coming soon...</p>
          </div>
        </div>
      )}

      {activeTab === 'cost' && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Cost Analysis</h2>
          <div className="text-center text-gray-500 py-12">
            <FiDollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Cost Analysis Dashboard</p>
            <p>Comprehensive cost metrics and ICC optimization coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalyticsPage;