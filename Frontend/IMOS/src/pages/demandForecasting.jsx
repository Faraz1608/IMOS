import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

// --- Mock Data and Services to make component self-contained ---
const useAuthStore = () => ({ token: 'mock-token' });

const mockForecastData = [
    { skuCode: 'HDWR-SCRW-001', skuName: 'Wood Screw Kit', last90DaysSales: 1500, forecastedMonthlyDemand: 500 },
    { skuCode: 'HDWR-BLT-005', skuName: 'M5 Bolt Pack', last90DaysSales: 1200, forecastedMonthlyDemand: 400 },
    { skuCode: 'PIPE-PVC-010', skuName: '10ft PVC Pipe', last90DaysSales: 600, forecastedMonthlyDemand: 200 },
    { skuCode: 'ELEC-WIRE-002', skuName: '14-Gauge Wire Spool', last90DaysSales: 450, forecastedMonthlyDemand: 150 },
    { skuCode: 'SAFE-GLVS-001', skuName: 'Safety Gloves', last90DaysSales: 300, forecastedMonthlyDemand: 100 },
];

const analyticsService = {
    getDemandForecast: (token) => new Promise(resolve => {
        setTimeout(() => resolve({ data: mockForecastData }), 1000);
    })
};
// --- End of Mock Data ---

const DemandForecastingPage = () => {
  const { token } = useAuthStore();
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        const res = await analyticsService.getDemandForecast(token);
        setForecastData(res.data);
      } catch (error) {
        toast.error('Could not fetch demand forecast.');
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [token]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Demand Forecasting</h1>
      
      <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Top 10 SKUs by Forecasted Demand</h2>
        <p className="text-gray-600 mb-4">
          This forecast predicts the expected monthly demand for each SKU based on sales data from the last 90 days.
        </p>
        {loading ? (
          <div className="text-center py-10">Loading forecast data...</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={forecastData.slice(0, 10)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="skuCode" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip cursor={{ fill: 'rgba(229, 231, 235, 0.5)' }} />
              <Legend />
              <Bar dataKey="forecastedMonthlyDemand" name="Forecasted Monthly Demand" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-700 p-4">Full Forecast Data</h2>
        <table className="min-w-full">
          <thead>
            <tr className="bg-blue-900">
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white rounded-tl-lg">SKU Code</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white">Product Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white">Last 90 Days Sales</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white rounded-tr-lg">Forecasted Monthly Demand</th>
            </tr>
          </thead>
          <tbody>
            {loading ? ( <tr><td colSpan="4" className="text-center py-8">Loading...</td></tr> )
            : (
              forecastData.map((item, index) => (
                <tr key={item.skuId} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap font-mono">{item.skuCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.skuName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.last90DaysSales} units</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-700">{item.forecastedMonthlyDemand} units</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DemandForecastingPage;
