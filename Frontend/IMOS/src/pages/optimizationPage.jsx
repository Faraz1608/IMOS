import React, { useState } from 'react';
import useAuthStore from '../store/authStore';
import { runAbcAnalysis, getSlottingRecommendations } from '../services/optimizationService.js';

const OptimizationsPage = () => {
  const { token } = useAuthStore();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('');

  const handleRunAbc = async () => {
    try {
      setLoading(true);
      const res = await runAbcAnalysis(token);
      setAnalysisMessage(res.data.message);
    } catch (error) {
      console.error("ABC Analysis failed:", error);
      setAnalysisMessage('Failed to run analysis.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await getSlottingRecommendations(token);
      setRecommendations(res.data);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Optimizations</h1>
      
      <div className="p-6 bg-white rounded-lg shadow space-y-4 mb-6">
        <h2 className="text-xl font-semibold">1. Run ABC Analysis</h2>
        <p className="text-gray-600">Classify all SKUs into A, B, or C based on velocity.</p>
        <button onClick={handleRunAbc} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? 'Running...' : 'Run Analysis'}
        </button>
        {analysisMessage && <p className="mt-2 text-green-700">{analysisMessage}</p>}
      </div>

      <div className="p-6 bg-white rounded-lg shadow space-y-4">
        <h2 className="text-xl font-semibold">2. Get Slotting Recommendations</h2>
        <p className="text-gray-600">Find fast-moving ('A' class) items that are stored in sub-optimal locations.</p>
        <button onClick={handleFetchRecommendations} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? 'Fetching...' : 'Get Recommendations'}
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="mt-6 bg-white shadow rounded-lg">
          <h3 className="text-lg font-bold p-4 border-b">Recommendations</h3>
          <ul className="divide-y divide-gray-200">
            {recommendations.map((rec, index) => (
              <li key={index} className="p-4">
                <p>Move SKU <span className="font-mono font-bold">{rec.skuToMove}</span></p>
                <p className="text-sm text-gray-600">From current location: <span className="font-mono">{rec.currentLocation}</span></p>
                <p className="text-sm text-green-700 font-medium">Suggestion: {rec.recommendation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default OptimizationsPage;