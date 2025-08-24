import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import useAuthStore from '../store/authStore';
import { getSkus, createSku, searchSkus } from '../services/skuService';
import Modal from '../components/modal.jsx';

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
      setFilteredSkus(response.data); // Initially show all
    } catch (error) {
      console.error('Failed to fetch SKUs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSkus();
  }, [token]);

  // Handle search logic
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSkus(allSkus); // If search is empty, show all SKUs
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

  const handleSearchSubmit = (term) => {
    if (term && !searchHistory.includes(term)) {
      const updatedHistory = [term, ...searchHistory].slice(0, 5);
      setSearchHistory(updatedHistory);
      localStorage.setItem('skuSearchHistory', JSON.stringify(updatedHistory));
    }
    setSearchTerm(term);
  };
  
  const handleInputChange = (e) => {
    setNewSkuData({ ...newSkuData, [e.target.name]: e.target.value });
  };

  const handleAddSku = async (e) => {
    e.preventDefault();
    try {
      await createSku(newSkuData, token);
      setIsModalOpen(false);
      setNewSkuData({ skuCode: '', name: '' });
      fetchAllSkus(); // Refresh the list
    } catch (error) {
      console.error('Failed to create SKU:', error);
      alert('Failed to create SKU.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">SKUs</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Add New SKU
        </button>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by SKU Code or Name..."
          className="w-full max-w-lg p-2 border rounded-md"
        />
        {searchHistory.length > 0 && (
          <div className="mt-2">
            <span className="text-sm text-gray-500">Recent:</span>
            {searchHistory.map((item, index) => (
              <button key={index} onClick={() => handleSearchSubmit(item)} className="text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-1 ml-2 hover:bg-gray-300">
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        {loading ? <p className="p-4 text-center">Loading...</p> : (
          <ul className="divide-y divide-gray-200">
            {filteredSkus.length > 0 ? (
              filteredSkus.map((sku) => (
                <li key={sku._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-mono text-lg">{sku.skuCode}</p>
                    <p className="text-sm text-gray-600">{sku.name}</p>
                  </div>
                  <Link to={`/skus/${sku._id}`} className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                    Edit
                  </Link>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">No SKUs found.</li>
            )}
          </ul>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New SKU">
        <form onSubmit={handleAddSku}>
          <div className="mb-4">
            <label htmlFor="skuCode" className="block text-sm font-medium">SKU Code</label>
            <input
              type="text" name="skuCode" id="skuCode"
              value={newSkuData.skuCode} onChange={handleInputChange}
              required className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium">Product Name</label>
            <input
              type="text" name="name" id="name"
              value={newSkuData.name} onChange={handleInputChange}
              required className="mt-1 block w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SkuPage;