import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getInventoryReport, getStockoutReport, getSlowMovingReport } from '../services/reportService';
import { getAgingReport } from '../services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiDownload } from 'react-icons/fi';

const ReportsPage = () => {
  const { token } = useAuthStore();
  const [loadingStates, setLoadingStates] = useState({});
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

  // Generic download handler for all report types
  const handleDownload = async (reportType) => {
      setLoadingStates(prev => ({ ...prev, [reportType]: true }));
      const toastId = toast.loading(`Generating ${reportType} report...`);

      let serviceCall;
      let fileName;

      switch(reportType) {
          case 'inventory':
              serviceCall = getInventoryReport(token);
              fileName = 'inventory-report.csv';
              break;
          case 'stockout':
              serviceCall = getStockoutReport(token);
              fileName = 'stockout-report.csv';
              break;
          case 'slowMoving':
              serviceCall = getSlowMovingReport(token);
              fileName = 'slow-moving-report.csv';
              break;
          default:
              toast.error('Unknown report type.', { id: toastId });
              setLoadingStates(prev => ({ ...prev, [reportType]: false }));
              return;
      }

      try {
          const response = await serviceCall;
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', fileName);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('Report downloaded!', { id: toastId });
      } catch (error) {
          const message = error.response?.status === 404
              ? 'No data found for this report.'
              : 'Failed to download report.';
          toast.error(message, { id: toastId });
      } finally {
          setLoadingStates(prev => ({ ...prev, [reportType]: false }));
      }
  };
  
  const ReportCard = ({ title, description, reportType, buttonText, colorClass }) => {
    const isLoading = loadingStates[reportType];
    const buttonClasses = `mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg disabled:bg-gray-400 ${!isLoading ? colorClass : ''}`;

    return (
        <div className="p-6 bg-gray-50 rounded-lg shadow-sm flex flex-col">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-gray-600 mt-1 flex-grow">{description}</p>
            <button 
              onClick={() => handleDownload(reportType)} 
              disabled={isLoading}
              className={buttonClasses}
            >
              <FiDownload /> {isLoading ? 'Generating...' : buttonText}
            </button>
        </div>
    );
  };


  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ReportCard 
            title="Full Inventory Report"
            description="Download a CSV of all current inventory records, including quantities, locations, and batch/serial numbers."
            reportType="inventory"
            buttonText="Download Inventory Report"
            colorClass="bg-blue-800 hover:bg-blue-900"
          />
          <ReportCard 
            title="Stockout Report"
            description="Generate a report of all items with a quantity of zero, requiring immediate reordering attention."
            reportType="stockout"
            buttonText="Download Stockout Report"
            colorClass="bg-red-600 hover:bg-red-700"
          />
          <ReportCard 
            title="Slow-Moving Report"
            description="Identify items that have not had any outbound movement in the last 90 days, tying up capital and space."
            reportType="slowMoving"
            buttonText="Download Slow-Moving Report"
            colorClass="bg-yellow-500 hover:bg-yellow-600"
          />
      </div>

      <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Inventory Aging Report (Top 10 Oldest Items)</h2>
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

