import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getSkus, createSku, deleteSku } from '../services/skuService';
import Modal from '../components/modal.jsx';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import io from 'socket.io-client';

const SkuPage = () => {
  const [allSkus, setAllSkus] = useState([]);
  const [filteredSkus, setFilteredSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkuData, setNewSkuData] = useState({ 
    skuCode: '', 
    name: '',
    properties: {
        dimensions: { w: '', d: '', h: '' },
        weightKg: ''
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuthStore();

  const fetchAllSkus = async () => {
    try {
      setLoading(true);
      const response = await getSkus(token);
      setAllSkus(response.data);
      setFilteredSkus(response.data);
    } catch (error) { toast.error('Could not fetch SKUs.');
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchAllSkus();

    const socket = io('http://localhost:7000');
    socket.on('skus_updated', () => {
        toast('SKU list has been updated.', { icon: '🔄' });
        fetchAllSkus();
    });
    return () => { socket.disconnect(); };
  }, [token]);

  useEffect(() => {
    const results = allSkus.filter(sku =>
      sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.skuCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSkus(results);
  }, [searchTerm, allSkus]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');

    if (parent === 'dimensions' && child) {
        setNewSkuData(prev => ({ ...prev, properties: { ...prev.properties, dimensions: { ...prev.properties.dimensions, [child]: value } } }));
    } else if (parent === 'properties' && child) {
        setNewSkuData(prev => ({ ...prev, properties: { ...prev.properties, [child]: value } }));
    } else {
        setNewSkuData({ ...newSkuData, [name]: value });
    }
  };

  const handleAddSku = async (e) => {
    e.preventDefault();
    try {
      await createSku(newSkuData, token);
      toast.success('SKU created successfully!');
      setIsModalOpen(false);
      setNewSkuData({ skuCode: '', name: '', properties: { dimensions: { w: '', d: '', h: '' }, weightKg: '' } });
      fetchAllSkus();
    } catch (error) { toast.error('Failed to create SKU.'); }
  };

  const handleDelete = async (skuId) => {
    if (window.confirm('Are you sure you want to delete this SKU?')) {
      try {
        await deleteSku(skuId, token);
        toast.success('SKU deleted successfully.');
        fetchAllSkus();
      } catch (error) { toast.error('Failed to delete SKU.'); }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products/SKUs</h1>
        <div className="flex items-center gap-4">
           <div className="relative">
             <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
             <input
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU Code or Name"
              className="w-full max-w-xs p-2 pl-10 border rounded-lg"
            />
           </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <FiPlus /> Add New SKU
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? <p>Loading...</p> : (
          filteredSkus.length > 0 ? (
            filteredSkus.map((sku) => (
              <div key={sku._id} className="p-4 bg-purple-50 rounded-lg flex justify-between items-center border border-purple-100">
                <div>
                  <p className="font-semibold text-gray-800">{sku.skuCode}</p>
                  <p className="text-sm text-gray-600">{sku.name}</p>
                   <p className="text-xs text-gray-400">{sku.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/skus/${sku._id}`} className="flex items-center text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100">
                    <FiEdit size={14}/> Edit
                  </Link>
                  <button onClick={() => handleDelete(sku._id)} className="flex items-center text-red-600 px-3 py-1 rounded-lg hover:bg-red-100">
                    <FiTrash2 size={14}/> Delete
                  </button>
                </div>
              </div>
            ))
          ) : ( <p className="text-center text-gray-500 py-8">No SKUs found.</p> )
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New SKU">
        <form onSubmit={handleAddSku} className="space-y-4 pt-4">
            <div>
              <label htmlFor="skuCode" className="block text-sm font-medium mb-1">SKU Code</label>
              <input type="text" name="skuCode" id="skuCode" value={newSkuData.skuCode} onChange={handleInputChange} required className="w-full p-2 border rounded-md"/>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Product Name</label>
              <input type="text" name="name" id="name" value={newSkuData.name} onChange={handleInputChange} required className="w-full p-2 border rounded-md"/>
            </div>
            <fieldset className="border p-2 rounded-md">
                <legend className="text-sm font-medium px-1">Properties</legend>
                <div className="space-y-2 p-2">
                    <label className="block text-sm font-medium">Dimensions (cm)</label>
                    <div className="grid grid-cols-3 gap-2">
                        <input type="number" name="dimensions.w" value={newSkuData.properties.dimensions.w} onChange={handleInputChange} placeholder="Width" className="w-full p-2 border rounded-md"/>
                        <input type="number" name="dimensions.d" value={newSkuData.properties.dimensions.d} onChange={handleInputChange} placeholder="Depth" className="w-full p-2 border rounded-md"/>
                        <input type="number" name="dimensions.h" value={newSkuData.properties.dimensions.h} onChange={handleInputChange} placeholder="Height" className="w-full p-2 border rounded-md"/>
                    </div>
                    <label htmlFor="properties.weightKg" className="block text-sm font-medium pt-2">Weight (Kg)</label>
                    <input type="number" id="properties.weightKg" name="properties.weightKg" value={newSkuData.properties.weightKg} onChange={handleInputChange} className="w-full p-2 border rounded-md"/>
                </div>
            </fieldset>
          <div className="flex justify-center pt-4">
            <button type="submit" className="w-full px-4 py-2.5 bg-blue-800 text-white rounded-lg hover:bg-blue-900">Create New SKU</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SkuPage;

