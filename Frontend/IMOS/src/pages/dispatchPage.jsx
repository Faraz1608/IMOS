import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getDispatches, createDispatch, updateDispatchStatus } from '../services/dispatchService';
import { getSkus } from '../services/skuService';
import Modal from '../components/modal.jsx';
import { FiPlus } from 'react-icons/fi';

const DispatchPage = () => {
  const { token } = useAuthStore();
  const [dispatches, setDispatches] = useState([]);
  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [orderId, setOrderId] = useState('');
  const [items, setItems] = useState([{ sku: '', quantity: 1 }]);

  const fetchDispatches = async () => {
    try {
      setLoading(true);
      const res = await getDispatches(token);
      setDispatches(res.data);
    } catch (error) {
      toast.error('Could not fetch dispatches.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkus = async () => {
    try {
      const res = await getSkus(token);
      setSkus(res.data);
    } catch (error) {
      toast.error('Could not fetch SKUs for form.');
    }
  };

  useEffect(() => {
    fetchDispatches();
    fetchSkus();
  }, [token]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { sku: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    try {
      await createDispatch({ orderId, items }, token);
      toast.success('Dispatch order created successfully!');
      setIsModalOpen(false);
      setOrderId('');
      setItems([{ sku: '', quantity: 1 }]);
      fetchDispatches();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create dispatch.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateDispatchStatus(id, status, token);
      toast.success('Dispatch status updated!');
      fetchDispatches();
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

   return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dispatch Orders</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <FiPlus /> Create Dispatch
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-blue-900">
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white rounded-tl-lg">Order ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white">Items</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white">Created At</th>
              <th className="px-6 py-3 text-left text-sm font-semibold uppercase text-white rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8">Loading dispatches...</td></tr>
            ) : (
              dispatches.map((dispatch) => (
                <tr key={dispatch._id} className="border-b">
                  <td className="px-6 py-4 font-mono">{dispatch.orderId}</td>
                  <td className="px-6 py-4">
                    {/* FIX: Check if item.sku exists before trying to access its name */}
                    {dispatch.items.map(item => 
                      item.sku ? `${item.sku.name} (x${item.quantity})` : '[Deleted SKU]'
                    ).join(', ')}
                  </td>
                  <td className="px-6 py-4">{dispatch.status}</td>
                  <td className="px-6 py-4">{new Date(dispatch.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={dispatch.status}
                      onChange={(e) => handleStatusChange(dispatch._id, e.target.value)}
                      className="p-1 border rounded-md"
                    >
                      <option value="Pending Dispatch">Pending Dispatch</option>
                      <option value="In Queue">In Queue</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* ... (Modal code remains the same) */}
    </div>
  );
};

export default DispatchPage;