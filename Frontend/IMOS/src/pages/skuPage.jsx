import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getSkus, createSku, searchSkus, deleteSku } from '../services/skuService'; // Import deleteSku
import Modal from '../components/modal.jsx';
import { FiPlus, FiEdit3, FiTrash2 } from 'react-icons/fi';

const SkuPage = () => {
  const [allSkus, setAllSkus] = useState([]);
  const [filteredSkus, setFilteredSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSkuData, setNewSkuData] = useState({ skuCode: '', name: '' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState(
    JSON.parse(localStorage.getItem('skuSearchHistory')) || []
  );
  
  const { token } = useAuthStore();

  const fetchAllSkus = async () => {
    try {
      setLoading(true);
      const response = await getSkus(token);
      setAllSkus(response.data);
      setFilteredSkus(response.data);
    } catch (error) {
      console.error('Failed to fetch SKUs:', error);
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
    const delayDebounceFn = setTimeout(() => {
      const fetchSearchResults = async () => {
        try {
          const res = await searchSkus(searchTerm, token);
          setFilteredSkus(res.data);
        } catch (error) {
          console.error('Search failed', error);
        }
      };
      fetchSearchResults();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, allSkus, token]);
  
  const handleInputChange = (e) => {
    setNewSkuData({ ...newSkuData, [e.target.name]: e.target.value });
  };

  const handleAddSku = async (e) => {
    e.preventDefault();
    try {
      await createSku(newSkuData, token);
      toast.success('SKU created successfully!');
      setIsModalOpen(false);
      setNewSkuData({ skuCode: '', name: '' });
      fetchAllSkus();
    } catch (error) {
      toast.error('Failed to create SKU.');
    }
  };

  // --- NEW FUNCTION ---
  const handleDelete = async (skuId) => {
    if (window.confirm('Are you sure you want to delete this SKU?')) {
      try {
        await deleteSku(skuId, token);
        toast.success('SKU deleted successfully.');
        fetchAllSkus(); // Refresh the list
      } catch (error) {
        toast.error('Failed to delete SKU.');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by SKU Code or Name..."
          className="w-full max-w-md p-2 border border-gray-300 rounded-lg"
        />
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <FiPlus />
          Add New SKU
        </button>
      </div>

      <div className="space-y-4">
        {loading ? <p>Loading...</p> : (
          filteredSkus.length > 0 ? (
            filteredSkus.map((sku) => (
              <div key={sku._id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center border border-gray-200">
                <div>
                  <p className="font-semibold text-gray-800">{sku.skuCode}</p>
                  <p className="text-sm text-gray-500">{sku.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/skus/${sku._id}`} className="p-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200">
                    <FiEdit3 />
                  </Link>
                  <button onClick={() => handleDelete(sku._id)} className="p-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200">
                    <FiTrash2 />
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
        <form onSubmit={handleAddSku}>
          <div className="mb-4">
            <label htmlFor="skuCode" className="block text-sm font-medium mb-1">SKU Code</label>
            <input
              type="text" name="skuCode" id="skuCode"
              value={newSkuData.skuCode} onChange={handleInputChange}
              required className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1">Product Name</label>
            <input
              type="text" name="name" id="name"
              value={newSkuData.name} onChange={handleInputChange}
              required className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Create New SKU</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SkuPage;