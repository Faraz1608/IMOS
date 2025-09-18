import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getInventory, setInventory, adjustInventory, deleteInventory } from '../services/inventoryService';
import { getSkus } from '../services/skuService';
import { getLayouts } from '../services/layoutService';
import { getLocationsByLayout } from '../services/locationService';
import Modal from '../components/modal.jsx';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import io from 'socket.io-client';

const InventoryPage = () => {
  const { token } = useAuthStore();
  const [inventory, setNewInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [layouts, setLayouts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [skus, setSkus] = useState([]);
  const [modalForm, setModalForm] = useState({ 
    selectedLayout: '', 
    selectedLocation: '', 
    selectedSku: '', 
    quantity: '',
    batchNumber: '',
    serialNumber: ''
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [adjustment, setAdjustment] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getInventory(token);
      const inventoryData = Array.isArray(res.data) ? res.data : [];
      setNewInventory(inventoryData);
      setFilteredInventory(inventoryData);
    } catch (error) {
      toast.error("Could not fetch inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();

    const socket = io('http://localhost:7000');
    socket.on('inventory_updated', () => {
        toast('Inventory has been updated.', { icon: '🔄' });
        fetchInventory();
    });
    return () => { socket.disconnect(); };
  }, [token]);

  useEffect(() => {
    if (isModalOpen) {
      const fetchModalData = async () => {
        try {
          const [layoutsRes, skusRes] = await Promise.all([getLayouts(token), getSkus(token)]);
          setLayouts(layoutsRes.data);
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
          setLocations([]);
        }
      };
      fetchLocations();
    } else { setLocations([]); }
  }, [modalForm.selectedLayout, token]);
  
  

  useEffect(() => {
    const results = inventory.filter(item =>
      (item.sku?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.sku?.skuCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.location?.locationCode?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredInventory(results);
  }, [searchTerm, inventory]);

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalForm(prev => ({
        ...prev,
        [name]: value,
        ...(name === 'selectedLayout' && { selectedLocation: '' })
    }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.selectedSku || !modalForm.selectedLocation || !modalForm.quantity || modalForm.quantity <= 0) {
      toast.error("Please fill out all fields with valid values."); return;
    }
    try {
      await setInventory({ 
        skuId: modalForm.selectedSku, 
        locationId: modalForm.selectedLocation, 
        quantity: modalForm.quantity,
        batchNumber: modalForm.batchNumber,
        serialNumber: modalForm.serialNumber
      }, token);
      toast.success(`Inventory set successfully!`);
      setIsModalOpen(false);
      setModalForm({ selectedLayout: '', selectedLocation: '', selectedSku: '', quantity: '', batchNumber: '', serialNumber: '' });
      fetchInventory();
    } catch (error) { 
      // This will now display the specific error from the backend (e.g., "Location is full")
      const errorMessage = error.response?.data?.message || "Failed to set inventory.";
      toast.error(errorMessage);
    }
  };

  const openEditModal = (item) => {
    setCurrentItem(item);
    setAdjustment('');
    setIsEditModalOpen(true);
  };

  const handleAdjustSubmit = async (operation) => {
    const adjustmentValue = parseInt(adjustment, 10);

    if (isNaN(adjustmentValue) || adjustmentValue <= 0) {
      toast.error("Please enter a valid positive number for the adjustment.");
      return;
    }

    const currentQuantity = currentItem.quantity;
    // Calculate the final new quantity based on the operation
    const newQuantity = operation === 'increase'
      ? currentQuantity + adjustmentValue
      : currentQuantity - adjustmentValue;

    if (newQuantity < 0) {
      toast.error("Quantity cannot be negative.");
      return;
    }

    try {
      // Pass the inventory item's ID and the final calculated quantity.
      // The 'token' is no longer needed here.
      await adjustInventory(currentItem._id, { quantity: newQuantity });
      
      toast.success('Quantity adjusted successfully!');
      setIsEditModalOpen(false);
      fetchInventory(); // Refresh the inventory list to show the change
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to adjust quantity.';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to remove ${item.sku.skuCode} from this location?`)) {
      try {
        await deleteInventory(item._id, token);
        toast.success('Inventory record removed.');
        fetchInventory();
      } catch (error) {
        toast.error('Failed to remove inventory.');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventory View</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search Inventory" className="w-full max-w-xs p-2 pl-10 border rounded-lg"/>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <FiPlus /> Set Inventory
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Location</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Batch #</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Serial #</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? ( <tr><td colSpan="6" className="text-center py-8">Loading inventory...</td></tr> )
            : (
              filteredInventory.map((item, index) => (
                <tr key={item._id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap">{item.sku?.skuCode || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.location?.locationCode || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{item.batchNumber || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{item.serialNumber || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.quantity} units</td>
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
        <form onSubmit={handleModalSubmit} className="space-y-4 pt-4">
          <select name="selectedLayout" value={modalForm.selectedLayout} onChange={handleModalChange} className="w-full p-2 border rounded-md">
            <option value="">-- Choose a Layout --</option>
            {layouts.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <select name="selectedLocation" value={modalForm.selectedLocation} onChange={handleModalChange} disabled={!modalForm.selectedLayout || locations.length === 0} className="w-full p-2 border rounded-md disabled:bg-gray-200">
            <option value="">-- Choose a Location --</option>
            {locations.map(loc => <option key={loc._id} value={loc._id}>{loc.locationCode}</option>)}
          </select>
          <select name="selectedSku" value={modalForm.selectedSku} onChange={handleModalChange} className="w-full p-2 border rounded-md">
            <option value="">-- Choose an SKU --</option>
            {skus.map(sku => <option key={sku._id} value={sku._id}>{sku.name} ({sku.skuCode})</option>)}
          </select>
          <input type="text" name="batchNumber" value={modalForm.batchNumber} onChange={handleModalChange} placeholder="Batch Number (Optional)" className="w-full p-2 border rounded-md" />
          <input type="text" name="serialNumber" value={modalForm.serialNumber} onChange={handleModalChange} placeholder="Serial Number (Optional)" className="w-full p-2 border rounded-md" />
          <input type="number" name="quantity" value={modalForm.quantity} onChange={handleModalChange} min="0" placeholder="Quantity" className="w-full p-2 border rounded-md" />
          <div className="flex justify-center pt-4">
            <button type="submit" className="w-full px-4 py-2.5 bg-blue-800 text-white rounded-lg">Map SKU to Location</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Adjust Quantity for ${currentItem?.sku?.skuCode}`}>
        <div className="space-y-4 pt-4">
          <div className="text-center">
              <p className="text-lg text-gray-600">Current Quantity</p>
              <p className="text-3xl font-bold text-blue-800">{currentItem?.quantity}</p>
          </div>
          <div>
            <label htmlFor="adjustment" className="block text-sm font-medium mb-1 text-gray-700">Adjust by:</label>
            <input type="number" id="adjustment" value={adjustment} onChange={(e) => setAdjustment(e.target.value)} placeholder="e.g., 10" required className="mt-1 block w-full p-2 border rounded-md"/>
          </div>
          <div className="flex justify-center gap-4 pt-4">
            <button onClick={() => handleAdjustSubmit('decrease')} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600">
                <FiMinusCircle /> Decrease
            </button>
            <button onClick={() => handleAdjustSubmit('increase')} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600">
                <FiPlusCircle /> Increase
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InventoryPage;

