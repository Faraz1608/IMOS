import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getInventoryReport } from '../services/reportService';
import { getAgingReport } from '../services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportsPage = () => {
  const { token } = useAuthStore();
  const [loadingReport, setLoadingReport] = useState(false);
  const [agingData, setAgingData] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Fetch Aging Report Data
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoadingAnalytics(true);
        const res = await getAgingReport(token);
        const sortedData = [...res.data].sort((a, b) => b.ageInDays - a.ageInDays);
        setAgingData(sortedData.slice(0, 10)); // Top 10 oldest
      } catch (error) {
        toast.error('Could not fetch aging report.');
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchReport();
  }, [token]);

  const handleDownloadInventory = async () => {
    setLoadingReport(true);
    const toastId = toast.loading('Generating your report...');
    try {
      const response = await getInventoryReport(token);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory-report.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded!', { id: toastId });
    } catch (error) {
      toast.error('Failed to download report.', { id: toastId });
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold">Inventory Report</h2>
        <p className="text-gray-600 mt-1">Download a CSV file of all current inventory, including SKU codes, product names, locations, and quantities.</p>
        <button 
          onClick={handleDownloadInventory} 
          disabled={loadingReport}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-400"
        >
          {loadingReport ? 'Generating...' : 'Download Report'}
        </button>
      </div>

      <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Analytics & Advanced Reporting</h2>
        <h3 className="text-md font-medium text-gray-600 mb-4">Inventory Aging Report (Top 10 Oldest Items)</h3>
        {loadingAnalytics ? <p>Loading report...</p> : (
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
              <Bar dataKey="ageInDays" name="Age (Days)" fill="#1E40AF" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;