import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import { getLayouts, createLayout, deleteLayout } from '../services/layoutService.js';
import Modal from '../components/modal.jsx';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const LayoutsPage = () => {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutDesc, setNewLayoutDesc] = useState('');
  const { token } = useAuthStore();

  const fetchLayouts = async () => {
    try {
      setLoading(true);
      const response = await getLayouts(token);
      setLayouts(response.data);
    } catch (error) {
      console.error('Failed to fetch layouts:', error);
      toast.error('Could not fetch layouts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayouts();
  }, [token]);

  const handleAddLayout = async (e) => {
    e.preventDefault();
    try {
      await createLayout({ name: newLayoutName, description: newLayoutDesc }, token);
      toast.success('Layout created successfully!');
      setIsModalOpen(false);
      setNewLayoutName('');
      setNewLayoutDesc('');
      fetchLayouts(); // Refresh the list
    } catch (error) {
      console.error('Failed to create layout:', error);
      toast.error('Failed to create layout.');
    }
  };

  const handleDeleteLayout = async (layoutId) => {
    if (window.confirm('Are you sure you want to delete this layout? This action cannot be undone.')) {
      try {
        await deleteLayout(layoutId, token);
        toast.success('Layout deleted successfully!');
        fetchLayouts(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete layout:', error);
        toast.error('Failed to delete layout.');
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Warehouse Layouts</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Add New Layout
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        {loading ? (
          <p className="p-4 text-center">Loading...</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {layouts.length > 0 ? (
              layouts.map((layout) => (
                <li key={layout._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <Link to={`/layouts/${layout._id}/locations`} className="text-lg font-medium hover:underline">{layout.name}</Link>
                    <p className="text-sm text-gray-500">{layout.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/layouts/${layout._id}`} className="p-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200">
                      <FiEdit />
                    </Link>
                    <button onClick={() => handleDeleteLayout(layout._id)} className="p-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200">
                      <FiTrash2 />
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-500">
                No layouts found. Click "Add New Layout" to get started.
              </li>
            )}
          </ul>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Layout">
        <form onSubmit={handleAddLayout}>
          <div className="mb-4">
            <label htmlFor="layoutName" className="block text-sm font-medium text-gray-700">Layout Name</label>
            <input
              type="text"
              id="layoutName"
              value={newLayoutName}
              onChange={(e) => setNewLayoutName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="layoutDesc" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="layoutDesc"
              value={newLayoutDesc}
              onChange={(e) => setNewLayoutDesc(e.target.value)}
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            ></textarea>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LayoutsPage;