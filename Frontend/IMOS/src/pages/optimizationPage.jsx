import React, { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { runAbcAnalysis, getSlottingRecommendations } from '../services/optimizationService.js';

const OptimizationsPage = () => {
  const { token } = useAuthStore();
  const [recommendations, setRecommendations] = useState([]);
  const [loadingAbc, setLoadingAbc] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const handleRunAbc = async () => {
    setLoadingAbc(true);
    const toastId = toast.loading('Running ABC analysis...');
    try {
      const res = await runAbcAnalysis(token);
      toast.success(res.data.message, { id: toastId });
    } catch (error) {
      console.error("ABC Analysis failed:", error);
      toast.error('Failed to run analysis.', { id: toastId });
    } finally {
      setLoadingAbc(false);
    }
  };
  
  const handleFetchRecommendations = async () => {
    setLoadingRecs(true);
    const toastId = toast.loading('Fetching recommendations...');
    try {
      const res = await getSlottingRecommendations(token);
      setRecommendations(res.data);
      toast.success('Recommendations fetched successfully.', { id: toastId });
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
      toast.error('Failed to fetch recommendations.', { id: toastId });
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-2">1. Run ABC Analysis</h2>
        <p className="text-gray-600 mb-4">Classify all SKUs into A, B, or C based on their movement velocity. This is a prerequisite for generating slotting recommendations.</p>
        <button 
          onClick={handleRunAbc} 
          disabled={loadingAbc} 
          className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
        >
          {loadingAbc ? 'Running...' : 'Run Analysis'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-2">2. Get Slotting Recommendations</h2>
        <p className="text-gray-600 mb-4">Find fast-moving ('A' class) items that are stored in sub-optimal locations to improve picking efficiency.</p>
        <button 
          onClick={handleFetchRecommendations} 
          disabled={loadingRecs} 
          className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
        >
          {loadingRecs ? 'Fetching...' : 'Get Recommendations'}
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg">
          <h3 className="text-xl font-bold p-4 border-b text-gray-800">Recommendations</h3>
          <ul className="divide-y divide-gray-200">
            {recommendations.map((rec, index) => (
              <li key={index} className="p-4 space-y-1">
                <p className="font-semibold text-gray-800">
                  Move SKU: <span className="font-mono font-bold text-emerald-700">{rec.skuToMove}</span>
                </p>
                <p className="text-sm text-gray-600">
                  From Current Location: <span className="font-mono">{rec.currentLocation}</span>
                </p>
                <p className="text-sm text-blue-600">
                  Suggestion: {rec.recommendation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OptimizationsPage;