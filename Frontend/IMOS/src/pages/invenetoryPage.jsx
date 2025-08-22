import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.js';
import { getLayouts } from '../services/layoutService.js';
import { getLocationsByLayout } from '../services/locationService.js';
import { getSkus } from '../services/skuService.js';
import { setInventory } from '../services/inventoryService.js';

const InventoryPage = () => {
  const { token } = useAuthStore();
  
  // Data states
  const [layouts, setLayouts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [skus, setSkus] = useState([]);

  // Form states
  const [selectedLayout, setSelectedLayout] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [quantity, setQuantity] = useState(0);

  // Fetch initial data for dropdowns
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const layoutsRes = await getLayouts(token);
        setLayouts(layoutsRes.data);
        const skusRes = await getSkus(token);
        setSkus(skusRes.data);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchInitialData();
  }, [token]);

  // Fetch locations when a layout is selected
  useEffect(() => {
    if (selectedLayout) {
      const fetchLocations = async () => {
        try {
          const res = await getLocationsByLayout(selectedLayout, token);
          setLocations(res.data);
        } catch (error) {
          console.error("Failed to fetch locations", error);
        }
      };
      fetchLocations();
    }
  }, [selectedLayout, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSku || !selectedLocation || quantity < 0) {
      alert('Please select an SKU, a location, and enter a valid quantity.');
      return;
    }
    try {
      await setInventory({ 
        skuId: selectedSku, 
        locationId: selectedLocation, 
        quantity 
      }, token);
      alert('Inventory updated successfully!');
      // Reset form
      setSelectedLocation('');
      setSelectedSku('');
      setQuantity(0);
    } catch (error) {
      console.error('Failed to set inventory:', error);
      alert('Failed to set inventory.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Set Inventory</h1>
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow space-y-4 max-w-lg">
        <div>
          <label htmlFor="layout" className="block text-sm font-medium">1. Select Layout</label>
          <select id="layout" value={selectedLayout} onChange={(e) => setSelectedLayout(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
            <option value="">-- Choose a Layout --</option>
            {layouts.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium">2. Select Location</label>
          <select id="location" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} disabled={!selectedLayout} className="mt-1 block w-full p-2 border rounded-md">
            <option value="">-- Choose a Location --</option>
            {locations.map(loc => <option key={loc._id} value={loc._id}>{loc.locationCode}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="sku" className="block text-sm font-medium">3. Select SKU</label>
          <select id="sku" value={selectedSku} onChange={(e) => setSelectedSku(e.target.value)} className="mt-1 block w-full p-2 border rounded-md">
            <option value="">-- Choose an SKU --</option>
            {skus.map(sku => <option key={sku._id} value={sku._id}>{sku.skuCode} - {sku.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium">4. Set Quantity</label>
          <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" className="mt-1 block w-full p-2 border rounded-md" />
        </div>

        <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Update Inventory
        </button>
      </form>
    </div>
  );
};

export default InventoryPage;