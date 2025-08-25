import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getSkus, createSku, searchSkus, deleteSku } from '../services/skuService';
import Modal from '../components/modal.jsx';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';

const SkuPage = () => {
  const [allSkus, setAllSkus] = useState([]);
  const [filteredSkus, setFilteredSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkuData, setNewSkuData] = useState({ skuCode: '', name: '', description: '' });
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const { token } = useAuthStore();

  const fetchAllSkus = async () => {
    try {
      setLoading(true);
      const response = await getSkus(token);
      setAllSkus(response.data);
      setFilteredSkus(response.data);
    } catch (error) {
      toast.error('Could not fetch SKUs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSkus();
  }, [token]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSkus(allSkus);
      return;
    }
     const results = allSkus.filter(sku =>
      sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.skuCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSkus(results);
  }, [searchTerm, allSkus]);
  
  const handleInputChange = (e) => {
    setNewSkuData({ ...newSkuData, [e.target.name]: e.target.value });
  };

  const handleAddSku = async (e) => {
    e.preventDefault();
    try {
      await createSku(newSkuData, token);
      toast.success('SKU created successfully!');
      setIsModalOpen(false);
      setNewSkuData({ skuCode: '', name: '', description: '' });
      fetchAllSkus();
    } catch (error) {
      toast.error('Failed to create SKU.');
    }
  };

  const handleDelete = async (skuId) => {
    if (window.confirm('Are you sure you want to delete this SKU?')) {
      try {
        await deleteSku(skuId, token);
        toast.success('SKU deleted successfully.');
        fetchAllSkus();
      } catch (error) {
        toast.error('Failed to delete SKU.');
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SKU</h1>
        <div className="flex items-center gap-4">
           <div className="relative">
             <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
             <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SKU Code or Name"
              className="w-full max-w-xs p-2 pl-10 border bg-gray-50 border-gray-300 rounded-lg"
            />
           </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-[#E59F71] text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <FiPlus />
            Add New SKU
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? <p>Loading...</p> : (
          filteredSkus.length > 0 ? (
            filteredSkus.map((sku) => (
              <div key={sku._id} className="p-4 bg-[#F0F5F2] rounded-lg flex justify-between items-center border border-transparent">
                <div>
                  <p className="font-semibold text-gray-800">{sku.skuCode}</p>
                  <p className="text-sm text-gray-500">{sku.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/skus/${sku._id}`} className="flex items-center gap-1 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100">
                    <FiEdit size={14}/> Edit
                  </Link>
                  <button onClick={() => handleDelete(sku._id)} className="flex items-center gap-1 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100">
                    <FiTrash2 size={14}/> Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No SKUs found.</p>
          )
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New SKU">
        <form onSubmit={handleAddSku} className="space-y-4">
            <div>
              <label htmlFor="skuCode" className="block text-sm font-medium mb-1">SKU Code</label>
              <input type="text" name="skuCode" id="skuCode" value={newSkuData.skuCode} onChange={handleInputChange} required className="w-full p-2 border rounded-md bg-gray-50"/>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Product Name</label>
              <input type="text" name="name" id="name" value={newSkuData.name} onChange={handleInputChange} required className="w-full p-2 border rounded-md bg-gray-50"/>
            </div>
             <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" id="description" value={newSkuData.description} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-gray-50" rows={3}></textarea>
            </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#3D6E4D] text-white rounded-lg hover:bg-opacity-90">Create New SKU</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SkuPage;