import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getSkuById, updateSku } from '../services/skuService';

const SkuDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [sku, setSku] = useState({ skuCode: '', name: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSku = async () => {
      try {
        const res = await getSkuById(id, token);
        setSku(res.data);
      } catch (error) {
        toast.error("Could not load SKU details.");
      } finally {
        setLoading(false);
      }
    };
    fetchSku();
  }, [id, token]);

  const handleChange = (e) => {
    setSku({ ...sku, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateSku(id, sku, token);
      toast.success('SKU updated successfully!');
      navigate('/skus');
    } catch (error) {
      toast.error('Failed to update SKU.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit SKU</h1>
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow space-y-4 max-w-lg">
        <div>
          <label htmlFor="skuCode" className="block text-sm font-medium">SKU Code</label>
          <input type="text" id="skuCode" name="skuCode" value={sku.skuCode} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Product Name</label>
          <input type="text" id="name" name="name" value={sku.name} onChange={handleChange} required className="mt-1 block w-full p-2 border rounded-md" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">Description</label>
          <textarea id="description" name="description" value={sku.description} onChange={handleChange} rows="3" className="mt-1 block w-full p-2 border rounded-md"></textarea>
        </div>
        <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigate('/skus')} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default SkuDetailPage;