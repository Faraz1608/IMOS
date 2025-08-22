import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.js';
import { getLayouts } from '../services/layoutService.js';
import { getLocationsByLayout } from '../services/locationService.js';
import { getInventoryByLocation } from '../services/inventoryService.js';

const InventoryViewPage = () => {
  const { token } = useAuthStore();
  const [layouts, setLayouts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Fetch layouts on initial render
  useEffect(() => {
    const fetchLayoutData = async () => {
      try {
        const res = await getLayouts(token);
        setLayouts(res.data);
      } catch (error) {
        console.error("Failed to fetch layouts", error);
      }
    };
    fetchLayoutData();
  }, [token]);

  // Fetch locations when a layout is selected
  useEffect(() => {
    if (selectedLayout) {
      const fetchLocationsData = async () => {
        try {
          const res = await getLocationsByLayout(selectedLayout, token);
          setLocations(res.data);
        } catch (error) {
          console.error("Failed to fetch locations", error);
        }
      };
      fetchLocationsData();
    }
  }, [selectedLayout, token]);

  // Fetch inventory when a location is selected
  useEffect(() => {
    if (selectedLocation) {
      const fetchInventoryData = async () => {
        try {
          const res = await getInventoryByLocation(selectedLocation, token);
          setInventory(res.data);
        } catch (error) {
          console.error("Failed to fetch inventory", error);
        }
      };
      fetchInventoryData();
    }
  }, [selectedLocation, token]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">View Inventory</h1>
      <div className="p-6 bg-white rounded-lg shadow space-y-4 max-w-lg mb-6">
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
      </div>

      {selectedLocation && (
        <div className="bg-white shadow rounded-lg">
          <h2 className="text-xl font-bold p-4 border-b">Stock at Selected Location</h2>
          <ul className="divide-y divide-gray-200">
            {inventory.length > 0 ? (
              inventory.map(item => (
                <li key={item._id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-mono text-lg">{item.sku.skuCode}</p>
                    <p className="text-sm text-gray-600">{item.sku.name}</p>
                  </div>
                  <p className="text-lg font-bold">{item.quantity}</p>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">No inventory found at this location.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InventoryViewPage;