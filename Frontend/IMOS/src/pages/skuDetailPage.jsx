import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getSkuById, updateSku } from '../services/skuService';

const SkuDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [sku, setSku] = useState({ 
    skuCode: '', 
    name: '', 
    description: '',
    properties: {
        dimensions: { w: 0, d: 0, h: 0 },
        weightKg: 0,
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSku = async () => {
      try {
        const res = await getSkuById(id, token);
        // Ensure properties and dimensions exist to prevent errors
        const data = {
            ...res.data,
            properties: {
                dimensions: res.data.properties?.dimensions || { w: 0, d: 0, h: 0 },
                weightKg: res.data.properties?.weightKg || 0,
            }
        };
        setSku(data);
      } catch (error) {
        toast.error("Could not load SKU details.");
      } finally {
        setLoading(false);
      }
    };
    fetchSku();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');

    if (parent === 'properties' && child) {
        setSku(prev => ({
            ...prev,
            properties: {
                ...prev.properties,
                [child]: value
            }
        }));
    } else if (parent === 'dimensions' && child) {
        setSku(prev => ({
            ...prev,
            properties: {
                ...prev.properties,
                dimensions: {
                    ...prev.properties.dimensions,
                    [child]: value
                }
            }
        }));
    } else {
        setSku({ ...sku, [name]: value });
    }
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

        <fieldset className="border p-2 rounded-md">
            <legend className="text-sm font-medium px-1">Properties</legend>
            <div className="space-y-2 p-2">
                <label className="block text-sm font-medium">Dimensions (cm)</label>
                <div className="grid grid-cols-3 gap-2">
                    <input type="number" name="dimensions.w" value={sku.properties.dimensions.w} onChange={handleChange} placeholder="Width" className="w-full p-2 border rounded-md"/>
                    <input type="number" name="dimensions.d" value={sku.properties.dimensions.d} onChange={handleChange} placeholder="Depth" className="w-full p-2 border rounded-md"/>
                    <input type="number" name="dimensions.h" value={sku.properties.dimensions.h} onChange={handleChange} placeholder="Height" className="w-full p-2 border rounded-md"/>
                </div>
                <label htmlFor="properties.weightKg" className="block text-sm font-medium pt-2">Weight (Kg)</label>
                <input type="number" id="properties.weightKg" name="properties.weightKg" value={sku.properties.weightKg} onChange={handleChange} className="w-full p-2 border rounded-md"/>
            </div>
        </fieldset>

        <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => navigate('/skus')} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default SkuDetailPage;

