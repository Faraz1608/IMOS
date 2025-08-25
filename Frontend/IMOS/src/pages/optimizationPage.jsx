import React, { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { runAbcAnalysis, getSlottingRecommendations, generatePickingRoute } from '../services/optimizationService.js';
import { FiArrowRight } from 'react-icons/fi';

const OptimizationsPage = () => {
  const { token } = useAuthStore();
  const [recommendations, setRecommendations] = useState([]);
  const [loadingAbc, setLoadingAbc] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  
  const [pickingItems, setPickingItems] = useState('');
  const [pickingRoute, setPickingRoute] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const handleRunAbc = async () => {
    setLoadingAbc(true);
    const toastId = toast.loading('Running ABC analysis...');
    try {
      const res = await runAbcAnalysis(token);
      toast.success(res.data.message, { id: toastId });
    } catch (error) {
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
      toast.error('Failed to fetch recommendations.', { id: toastId });
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleGenerateRoute = async () => {
    if (!pickingItems.trim()) {
      toast.error('Please enter at least one SKU and quantity.');
      return;
    }
    setLoadingRoute(true);
    const items = pickingItems.split('\n').map(line => {
      const [skuCode, quantity] = line.split(',');
      return { skuCode: skuCode?.trim(), quantity: parseInt(quantity?.trim(), 10) || 1 };
    });

    try {
      const res = await generatePickingRoute(items, token);
      setPickingRoute(res.data.pickingRoute);
      toast.success('Picking route generated!');
    } catch (error) {
      toast.error('Failed to generate route.');
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">ICC Optimization</h1>
      
      {/* Section 1: ABC Analysis */}
      <div className="border-b pb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">1. Run ABC Analysis</h2>
        <p className="text-gray-600 mb-4 max-w-2xl">Classify all SKUs into A, B, or C based on their movement velocity. This is a prerequisite for generating slotting recommendations.</p>
        <button 
          onClick={handleRunAbc} 
          disabled={loadingAbc} 
          className="px-4 py-2 bg-[#3D6E4D] text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
        >
          {loadingAbc ? 'Running...' : 'Run Analysis'}
        </button>
      </div>

      {/* Section 2: Slotting Recommendations */}
      <div className="border-b pb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">2. Get Slotting Recommendations</h2>
        <p className="text-gray-600 mb-4 max-w-2xl">Find fast-moving ('A' class) items that are stored in sub-optimal locations to improve picking efficiency.</p>
        <button 
          onClick={handleFetchRecommendations} 
          disabled={loadingRecs} 
          className="px-4 py-2 bg-[#3D6E4D] text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
        >
          {loadingRecs ? 'Fetching...' : 'Get Recommendations'}
        </button>
         {recommendations.length > 0 && (
          <div className="mt-4 space-y-2 max-w-md">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-3 bg-[#F0F5F2] rounded-md text-sm">
                <p className="font-semibold text-gray-700">Move SKU: <span className="font-mono text-[#3D6E4D]">{rec.skuToMove}</span></p>
                <p className="text-gray-500">From: <span className="font-mono">{rec.currentLocation}</span></p>
                <p className="text-blue-600">Suggestion: {rec.recommendation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Section 3: Picking Route */}
       <div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">3. Generate Optimal Picking Route</h2>
        <p className="text-gray-600 mb-4 max-w-2xl">Enter a list of SKUs and quantities (one per line, comma-separated) to generate a simulated optimal picking path.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <label htmlFor="pickingItems" className="block text-sm font-medium text-gray-700 mb-1">SKU Code, Quantity</label>
            <textarea
              id="pickingItems"
              rows="5"
              value={pickingItems}
              onChange={(e) => setPickingItems(e.target.value)}
              placeholder="HDWR-SCRW-001, 10&#10;HDWR-BLT-005, 50"
              className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-[#3D6E4D] focus:border-transparent"
            ></textarea>
            <button 
              onClick={handleGenerateRoute} 
              disabled={loadingRoute} 
              className="mt-2 w-full px-4 py-2 bg-[#3D6E4D] text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
            >
              {loadingRoute ? 'Generating...' : 'Generate Route'}
            </button>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Optimized Picking Path</label>
            {pickingRoute.length > 0 ? (
                <div className="p-3 bg-[#F0F5F2] rounded-md space-y-2">
                    {pickingRoute.map((loc, index) => (
                        <div key={index} className="flex items-center gap-2">
                           <div className="flex-shrink-0 w-6 h-6 bg-[#3D6E4D] text-white text-xs rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                           <span className="font-mono text-gray-700">{loc}</span>
                           {index < pickingRoute.length - 1 && <FiArrowRight className="text-gray-400" />}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-3 bg-gray-50 rounded-md border text-center text-gray-500 text-sm h-full flex items-center justify-center min-h-[140px]">
                    Your route will appear here.
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationsPage;