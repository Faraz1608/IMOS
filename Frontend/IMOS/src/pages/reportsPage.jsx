import React, { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getInventoryReport } from '../services/reportService';

const ReportsPage = () => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleDownloadInventory = async () => {
    setLoading(true);
    toast.loading('Generating your report...');

    try {
      const response = await getInventoryReport(token);
      
      // Create a URL for the blob data
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory-report.csv'); // or any other filename
      document.body.appendChild(link);
      link.click();
      
      // Clean up the temporary link and URL
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.dismiss(); // Remove the "loading" toast
      toast.success('Report downloaded successfully!');

    } catch (error) {
      console.error("Failed to download report:", error);
      toast.dismiss();
      toast.error('Failed to download report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <div className="p-6 bg-white rounded-lg shadow space-y-4">
        <h2 className="text-xl font-semibold">Inventory Report</h2>
        <p className="text-gray-600">Download a CSV file of all current inventory, including SKU codes, product names, locations, and quantities.</p>
        <button 
          onClick={handleDownloadInventory} 
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Generating...' : 'Download Report'}
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;