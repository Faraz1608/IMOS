import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import { getLayouts } from '../services/layoutService.js';
import { getLocationsByLayout } from '../services/locationService.js';
import { getInventoryByLocation, adjustInventory, deleteInventory } from '../services/inventoryService.js';
import Modal from '../components/modal.jsx';

const InventoryViewPage = () => {
  const { token, inventoryLastUpdated } = useAuthStore();
  const [layouts, setLayouts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [adjustment, setAdjustment] = useState(''); // Allow string for flexible input

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
          setInventory([]); // Reset inventory list when layout changes
          setSelectedLocation(''); // Reset location selection
        } catch (error) {
          console.error("Failed to fetch locations", error);
        }
      };
      fetchLocationsData();
    }
  }, [selectedLayout, token]);

  const fetchInventory = async () => {
    if (!selectedLocation) {
      setInventory([]); // Clear inventory if no location is selected
      return;
    }
    try {
      const res = await getInventoryByLocation(selectedLocation, token);
      setInventory(res.data);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
      toast.error("Could not fetch inventory.");
    }
  };

  // Fetch inventory when a location is selected OR when inventory is updated elsewhere
  useEffect(() => {
    fetchInventory();
  }, [selectedLocation, token, inventoryLastUpdated]);

  const openAdjustModal = (item) => {
    setCurrentItem(item);
    setAdjustment(''); // Reset to empty string
    setIsModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const adjustmentValue = parseInt(adjustment);
    if (isNaN(adjustmentValue)) {
      toast.error("Please enter a valid number.");
      return;
    }

    const newQuantity = currentItem.quantity + adjustmentValue;
    if (newQuantity < 0) {
      toast.error("Inventory quantity cannot be negative.");
      return;
    }

    try {
      await adjustInventory({ 
        skuId: currentItem.sku._id, 
        locationId: currentItem.location,
        adjustment: adjustmentValue,
      }, token);
      toast.success('Quantity adjusted!');
      setIsModalOpen(false);
      fetchInventory(); // Refresh list
    } catch (error) {
      toast.error('Failed to adjust quantity.');
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to remove ${item.sku.skuCode} from this location?`)) {
      try {
        await deleteInventory({ 
          skuId: item.sku._id, 
          locationId: item.location 
        }, token);
        toast.success('Inventory record removed.');
        fetchInventory(); // Refresh list
      } catch (error) {
        toast.error('Failed to remove inventory.');
      }
    }
  };

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
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold">{item.quantity}</p>
                    <button onClick={() => openAdjustModal(item)} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">Adjust</button>
                    <button onClick={() => handleDelete(item)} className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded">Remove</button>
                  </div>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">No inventory found at this location.</li>
            )}
          </ul>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Adjust Quantity for ${currentItem?.sku?.skuCode}`}>
        <form onSubmit={handleAdjustSubmit}>
          <div className="mb-4">
            <label htmlFor="adjustment" className="block text-sm font-medium">Adjustment (+/-)</label>
            <input
              type="text"
              id="adjustment"
              value={adjustment}
              onChange={(e) => {
                if (e.target.value === '' || e.target.value === '-' || /^-?\d+$/.test(e.target.value)) {
                  setAdjustment(e.target.value);
                }
              }}
              required
              className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
            <p className="text-sm text-gray-500 mt-2">
              New Quantity: {currentItem?.quantity + (parseInt(adjustment) || 0)}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryViewPage;