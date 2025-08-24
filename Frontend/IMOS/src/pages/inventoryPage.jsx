import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getInventory, setInventory } from '../services/inventoryService';
import { getSkus } from '../services/skuService';
import { getLayouts } from '../services/layoutService';
import { getLocationsByLayout } from '../services/locationService';
import Modal from '../components/modal.jsx';
import { FiPlus, FiSearch } from 'react-icons/fi';

const InventoryPage = () => {
  const { token, triggerInventoryUpdate, inventoryLastUpdated } = useAuthStore();
  
  // Data for the main inventory table
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State for the "Set Inventory" modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [layouts, setLayouts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [skus, setSkus] = useState([]);
  const [modalForm, setModalForm] = useState({
    selectedLayout: '',
    selectedLocation: '',
    selectedSku: '',
    quantity: 0,
  });

  // --- Data Fetching ---

  // Fetches the main inventory list for the table
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getInventory(token);
      setInventory(Array.isArray(res.data) ? res.data : []);
      setFilteredInventory(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error("Could not fetch inventory.");
      setInventory([]);
      setFilteredInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [token, inventoryLastUpdated]);

  // Fetches the necessary data (layouts and SKUs) for the modal's dropdowns
  useEffect(() => {
    if (isModalOpen) {
      const fetchModalData = async () => {
        try {
          const layoutsRes = await getLayouts(token);
          setLayouts(layoutsRes.data);
          const skusRes = await getSkus(token);
          setSkus(skusRes.data);
        } catch (error) {
          toast.error("Could not load data for the form.");
        }
      };
      fetchModalData();
    }
  }, [isModalOpen, token]);
  
  // Fetches the locations for the modal's dropdown when a layout is selected
  useEffect(() => {
    if (modalForm.selectedLayout) {
      const fetchLocations = async () => {
        try {
            const res = await getLocationsByLayout(modalForm.selectedLayout, token);
            setLocations(res.data);
        } catch(error){
            console.error("Failed to fetch locations", error)
        }
      };
      fetchLocations();
    }
  }, [modalForm.selectedLayout, token]);


  // --- Event Handlers ---

  // Handles filtering the main inventory table as the user types
  useEffect(() => {
    if (!Array.isArray(inventory)) return;
    const results = inventory.filter(item =>
      item.sku?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.skuCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.locationCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInventory(results);
  }, [searchTerm, inventory]);

  // Handles input changes within the modal
  const handleModalChange = (e) => {
    setModalForm({ ...modalForm, [e.target.name]: e.target.value });
  };
  
  // Handles the submission of the "Set Inventory" form
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.selectedSku || !modalForm.selectedLocation || modalForm.quantity < 0) {
      toast.error("Please fill out all fields with valid data.");
      return;
    }
    try {
      await setInventory({
        skuId: modalForm.selectedSku,
        locationId: modalForm.selectedLocation,
        quantity: modalForm.quantity,
      }, token);
      toast.success("Inventory set successfully!");
      setIsModalOpen(false);
      triggerInventoryUpdate(); // Triggers a refresh of the inventory list
    } catch (error) {
      toast.error("Failed to set inventory.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Inventory..."
            className="w-full max-w-md p-2 pl-10 border border-gray-300 rounded-lg"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <FiPlus />
          Set Inventory
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
            ) : (
              filteredInventory.map(item => (
                <tr key={item._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.sku?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.location?.locationCode || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.sku?.skuCode || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.quantity} units</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Set Inventory">
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <select name="selectedLayout" onChange={handleModalChange} className="w-full p-2 border rounded-md">
            <option value="">-- Select a Layout --</option>
            {layouts.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <select name="selectedLocation" onChange={handleModalChange} disabled={!modalForm.selectedLayout} className="w-full p-2 border rounded-md">
            <option value="">-- Select a Location --</option>
            {locations.map(loc => <option key={loc._id} value={loc._id}>{loc.locationCode}</option>)}
          </select>
          <select name="selectedSku" onChange={handleModalChange} className="w-full p-2 border rounded-md">
            <option value="">-- Select an SKU --</option>
            {skus.map(sku => <option key={sku._id} value={sku._id}>{sku.skuCode} - {sku.name}</option>)}
          </select>
          <input type="number" name="quantity" placeholder="Quantity" onChange={handleModalChange} min="0" className="w-full p-2 border rounded-md" />
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Map SKU to Location</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;