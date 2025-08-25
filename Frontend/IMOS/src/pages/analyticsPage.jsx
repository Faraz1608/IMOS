import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getAgingReport } from '../services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsPage = () => {
  const { token } = useAuthStore();
  const [agingData, setAgingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await getAgingReport(token);
        // Sort data and take top 10 oldest items for charting
        const sortedData = [...res.data].sort((a, b) => b.ageInDays - a.ageInDays);
        setAgingData(sortedData.slice(0, 10));
      } catch (error) {
        toast.error('Could not fetch aging report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Analytics & Advanced Reporting</h1>

      <div className="bg-[#F0F5F2] p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Inventory Aging Report (Top 10 Oldest Items)</h2>
        {loading ? (
          <p>Loading report...</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={agingData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" unit=" days" />
              <YAxis dataKey="skuCode" type="category" width={120} />
              <Tooltip cursor={{ fill: 'rgba(229, 231, 235, 0.5)' }} />
              <Legend />
              <Bar dataKey="ageInDays" name="Age (Days)" fill="#3D6E4D" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;