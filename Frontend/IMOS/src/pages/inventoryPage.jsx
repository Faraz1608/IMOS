import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getInventory, setInventory, adjustInventory, deleteInventory } from '../services/inventoryService';
import { getSkus } from '../services/skuService';
import { getLayouts } from '../services/layoutService';
import { getLocationsByLayout } from '../services/locationService';
import Modal from '../components/modal.jsx';
import { FiPlus, FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';
import io from 'socket.io-client';
const InventoryPage = () => {
  const { token, inventoryLastUpdated } = useAuthStore();
  const [inventory, setNewInventory] = useState([]); // Corrected to setNewInventory
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [layouts, setLayouts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [skus, setSkus] = useState([]);
  const [modalForm, setModalForm] = useState({ selectedLayout: '', selectedLocation: '', selectedSku: '', quantity: 0 });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [adjustment, setAdjustment] = useState('');

  useEffect(() => {
  const socket = io('http://localhost:7000'); // Your backend URL

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
  });

  // Listen for the 'inventory_updated' event
  socket.on('inventory_updated', () => {
    toast('Inventory has been updated by another user.', { icon: '🔄' });
    fetchInventory(); // Re-fetch the inventory list
  });

  // Clean up the connection when the component unmounts
  return () => {
    socket.disconnect();
  };
}, []);
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getInventory(token);
      const inventoryData = Array.isArray(res.data) ? res.data : [];
      setNewInventory(inventoryData); // Corrected to setNewInventory
      setFilteredInventory(inventoryData);
    } catch (error) {
      toast.error("Could not fetch inventory.");
      setNewInventory([]); // Corrected to setNewInventory
      setFilteredInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, [token, inventoryLastUpdated]);

  useEffect(() => {
    if (isModalOpen) {
      const fetchModalData = async () => {
        try {
          const layoutsRes = await getLayouts(token);
          setLayouts(layoutsRes.data);
          const skusRes = await getSkus(token);
          setSkus(skusRes.data);
        } catch (error) { toast.error("Could not load data for the form."); }
      };
      fetchModalData();
    }
  }, [isModalOpen, token]);

  useEffect(() => {
    if (modalForm.selectedLayout) {
      const fetchLocations = async () => {
        try {
          const res = await getLocationsByLayout(modalForm.selectedLayout, token);
          setLocations(res.data || []);
        } catch (error) {
          console.error("Failed to fetch locations", error);
          setLocations([]);
        }
      };
      fetchLocations();
    } else {
      setLocations([]);
    }
  }, [modalForm.selectedLayout, token]);

  useEffect(() => {
    if (!Array.isArray(inventory)) {
      setFilteredInventory([]);
      return;
    }
    const results = inventory.filter(item =>
      (item.sku?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.sku?.skuCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.location?.locationCode?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredInventory(results);
  }, [searchTerm, inventory]);

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    if (name === 'selectedLayout') {
      setModalForm({
        ...modalForm,
        selectedLayout: value,
        selectedLocation: '',
      });
    } else {
      setModalForm({ ...modalForm, [name]: value });
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.selectedSku || !modalForm.selectedLocation || modalForm.quantity < 0) {
      toast.error("Please fill out all fields."); return;
    }
    try {
      await setInventory({ skuId: modalForm.selectedSku, locationId: modalForm.selectedLocation, quantity: modalForm.quantity }, token);
      toast.success(`Inventory set successfully!`);
      setIsModalOpen(false);
      fetchInventory();
    } catch (error) { toast.error("Failed to set inventory."); }
  };

  const openEditModal = (item) => { setCurrentItem(item); setAdjustment(item.quantity); setIsEditModalOpen(true); };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    const newQuantity = parseInt(adjustment);
    if (isNaN(newQuantity) || newQuantity < 0) { toast.error("Please enter a valid quantity."); return; }
    try {
      await adjustInventory(currentItem._id, { quantity: newQuantity }, token);
      toast.success('Quantity adjusted!');
      setIsEditModalOpen(false);
      fetchInventory();
    } catch (error) { toast.error('Failed to adjust quantity.'); }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to remove ${item.sku.skuCode} from this location?`)) {
      try {
        await deleteInventory(item._id, token);
        toast.success('Inventory record removed.');
        fetchInventory();
      } catch (error) { toast.error('Failed to remove inventory.'); }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory View</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Inventory"
              className="w-full max-w-xs p-2 pl-10 border bg-gray-50 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3D6E4D] focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#E59F71] text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-sm"
          >
            <FiPlus /> Set Inventory
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-[#1E392A]">
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white rounded-l-lg">Product Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white">Location</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white">Quantity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white rounded-r-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8 text-gray-500">Loading inventory...</td></tr>
            ) : (
              filteredInventory.map((item, index) => (
                <tr key={item._id} className={index % 2 === 0 ? 'bg-[#F0F5F2]' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{item.sku?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.location?.locationCode || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.sku?.skuCode || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{item.quantity} units</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-900 mr-4"><FiEdit /></button>
                    <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-900"><FiTrash2 /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Set Inventory">
        <form onSubmit={handleModalSubmit} className="space-y-4">
           <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Select Layout</label>
            <select name="selectedLayout" value={modalForm.selectedLayout} onChange={handleModalChange} className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-[#3D6E4D] focus:border-transparent">
              <option value="">-- Choose a Layout --</option>
              {layouts.map(layout => <option key={layout._id} value={layout._id}>{layout.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Product Name</label>
            <select name="selectedSku" value={modalForm.selectedSku} onChange={handleModalChange} className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-[#3D6E4D] focus:border-transparent">
              <option value="">-- Choose a Product --</option>
              {skus.map(sku => <option key={sku._id} value={sku._id}>{sku.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Select Location</label>
            <select name="selectedLocation" value={modalForm.selectedLocation} onChange={handleModalChange} disabled={!modalForm.selectedLayout || locations.length === 0} className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-[#3D6E4D] focus:border-transparent disabled:bg-gray-200">
              <option value="">-- Choose a Location --</option>
              {locations.map(loc => <option key={loc._id} value={loc._id}>{loc.locationCode}</option>)}
            </select>
          </div>
          <div>
             <label className="block text-sm font-medium mb-1 text-gray-700">Set Quantity</label>
            <input type="number" name="quantity" placeholder="0" value={modalForm.quantity} onChange={handleModalChange} min="0" className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-[#3D6E4D] focus:border-transparent" />
          </div>
          <div className="flex justify-center pt-4">
            <button type="submit" className="w-full px-4 py-2.5 bg-[#3D6E4D] text-white rounded-lg hover:bg-opacity-90 shadow-sm">Map SKU to Location</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Quantity for ${currentItem?.sku?.skuCode}`}>
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label htmlFor="adjustment" className="block text-sm font-medium mb-1 text-gray-700">Quantity</label>
            <input type="number" id="adjustment" value={adjustment} onChange={(e) => setAdjustment(e.target.value)} required className="mt-1 block w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-[#3D6E4D] focus:border-transparent"/>
          </div>
          <div className="flex justify-center gap-2 pt-4">
            <button type="submit" className="w-full px-4 py-2.5 bg-[#3D6E4D] text-white rounded-lg">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;