import React, { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { runAbcAnalysis, getSlottingRecommendations, generatePickingRoute } from '../services/optimizationService.js';
import { moveInventory } from '../services/inventoryService.js';
import { FiArrowRight, FiPlayCircle, FiList, FiNavigation, FiCheckCircle } from 'react-icons/fi';

const OptimizationsPage = () => {
  const { token } = useAuthStore();
  const [recommendations, setRecommendations] = useState([]);
  const [loadingAbc, setLoadingAbc] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [movingItem, setMovingItem] = useState(null);
  
  const [pickingItems, setPickingItems] = useState('');
  const [pickingRoute, setPickingRoute] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const handleRunAbc = async () => {
    setLoadingAbc(true);
    const toastId = toast.loading('Running ABC analysis based on last 90 days of movement...');
    try {
      const res = await runAbcAnalysis(token);
      toast.success(res.data.message, { id: toastId, duration: 4000 });
    } catch (error) {
      toast.error('Failed to run analysis.', { id: toastId });
    } finally {
      setLoadingAbc(false);
    }
  };
  
  const handleFetchRecommendations = async () => {
    setLoadingRecs(true);
    const toastId = toast.loading('Generating intelligent slotting recommendations...');
    try {
      const res = await getSlottingRecommendations(token);
      setRecommendations(res.data);
      if (res.data.length === 0) {
          toast.success('No slotting recommendations at this time. Your warehouse is optimally slotted!', { id: toastId, duration: 4000, icon: <FiCheckCircle/> });
      } else {
          toast.success(`${res.data.length} recommendation(s) found.`, { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to fetch recommendations.', { id: toastId });
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleMoveItem = async (inventoryId, newLocationId) => {
    setMovingItem(inventoryId);
    const toastId = toast.loading('Executing inventory move...');
    try {
        await moveInventory(inventoryId, { newLocationId }, token);
        toast.success('Item moved successfully!', { id: toastId });
        // Refresh recommendations after a successful move
        handleFetchRecommendations();
    } catch (error) {
        toast.error('Failed to move item.', { id: toastId });
    } finally {
        setMovingItem(null);
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* ABC Analysis */}
          <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"><FiPlayCircle/> Run ABC Analysis</h2>
            <p className="text-gray-600 mb-4">Classify SKUs into A, B, or C based on movement velocity. This is a prerequisite for slotting recommendations.</p>
            <button onClick={handleRunAbc} disabled={loadingAbc} className="w-full px-4 py-2 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-900 disabled:bg-gray-400">
              {loadingAbc ? 'Running...' : 'Run Analysis'}
            </button>
          </div>

          {/* Slotting Recommendations */}
          <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"><FiList /> Get Slotting Recommendations</h2>
            <p className="text-gray-600 mb-4">Find fast-moving ('A' class) items in sub-optimal locations to improve picking efficiency.</p>
            <button onClick={handleFetchRecommendations} disabled={loadingRecs} className="w-full px-4 py-2 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-900 disabled:bg-gray-400">
              {loadingRecs ? 'Fetching...' : 'Get Recommendations'}
            </button>
            {recommendations.length > 0 && (
              <div className="mt-4 space-y-2">
                {recommendations.map((rec, index) => (
                   <div key={index} className="p-3 bg-blue-50 rounded-md border border-blue-200 flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-gray-700">Move SKU: <span className="font-mono text-blue-800">{rec.skuToMove}</span></p>
                        <p className="text-gray-500 text-sm">From: <span className="font-mono">{rec.currentLocation}</span></p>
                        <p className="text-blue-700 font-medium text-sm">{rec.recommendation}</p>
                    </div>
                    <button
                        onClick={() => handleMoveItem(rec.inventoryId, rec.newLocationId)}
                        disabled={movingItem === rec.inventoryId}
                        className="px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 disabled:bg-gray-400"
                    >
                        {movingItem === rec.inventoryId ? 'Moving...' : 'Execute Move'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"><FiNavigation/> Generate Optimal Picking Route</h2>
          <p className="text-gray-600 mb-4">Enter SKUs and quantities (one per line, comma-separated) to generate a simulated optimal picking path.</p>
          
          <div>
            <label htmlFor="pickingItems" className="block text-sm font-medium text-gray-700 mb-1">SKU Code, Quantity</label>
            <textarea
              id="pickingItems" rows="5" value={pickingItems}
              onChange={(e) => setPickingItems(e.target.value)}
              placeholder="HDWR-SCRW-001, 10&#10;HDWR-BLT-005, 50"
              className="w-full p-2 border rounded-md"
            ></textarea>
            <button onClick={handleGenerateRoute} disabled={loadingRoute} className="mt-2 w-full px-4 py-2 bg-blue-800 text-white font-semibold rounded-lg hover:bg-blue-900 disabled:bg-gray-400">
              {loadingRoute ? 'Generating...' : 'Generate Route'}
            </button>
          </div>
          <div className="mt-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Optimized Picking Path</label>
            {pickingRoute.length > 0 ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
                    {pickingRoute.map((loc, index) => (
                        <div key={index} className="flex items-center gap-2">
                           <div className="flex-shrink-0 w-6 h-6 bg-blue-800 text-white text-xs rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                           <span className="font-mono text-gray-700">{loc}</span>
                           {index < pickingRoute.length - 1 && <FiArrowRight className="text-gray-400" />}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-3 bg-white rounded-md border text-center text-gray-500 text-sm h-full flex items-center justify-center min-h-[140px]">
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

