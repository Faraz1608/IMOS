import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import { getLayouts, createLayout, deleteLayout } from '../services/layoutService.js';
import Modal from '../components/modal.jsx';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';

const LayoutsPage = () => {
  const [layouts, setLayouts] = useState([]);
  const [filteredLayouts, setFilteredLayouts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutDesc, setNewLayoutDesc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuthStore();

  const fetchLayouts = async () => {
    try {
      setLoading(true);
      const response = await getLayouts(token);
      setLayouts(response.data);
      setFilteredLayouts(response.data);
    } catch (error) {
      toast.error('Could not fetch layouts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayouts();
  }, [token]);

  useEffect(() => {
    const results = layouts.filter(layout =>
      layout.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLayouts(results);
  }, [searchTerm, layouts]);

  const handleAddLayout = async (e) => {
    e.preventDefault();
    try {
      await createLayout({ name: newLayoutName, description: newLayoutDesc }, token);
      toast.success('Layout created successfully!');
      setIsModalOpen(false);
      setNewLayoutName('');
      setNewLayoutDesc('');
      fetchLayouts();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create layout.';
      toast.error(errorMessage);
    }
  };

  const handleDeleteLayout = async (layoutId) => {
    if (window.confirm('Are you sure you want to delete this layout? This will also delete all associated locations and inventory records.')) {
      try {
        await deleteLayout(layoutId, token);
        toast.success('Layout deleted successfully!');
        fetchLayouts();
      } catch (error) {
        toast.error('Failed to delete layout.');
      }
    }
  };

  return (
    <div>
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Layouts</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Layout"
              className="w-full max-w-xs p-2 pl-10 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <FiPlus /> Add Layout
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-center py-8 text-gray-500">Loading...</p>
        ) : (
          filteredLayouts.map((layout) => (
            <div key={layout._id} className="p-4 bg-purple-50 rounded-lg flex justify-between items-center border border-purple-100">
              <div>
                 <Link to={`/layouts/${layout._id}/locations`} className="font-bold text-gray-800 hover:underline">{layout.name}</Link>
                 <p className="text-sm text-gray-600">{layout.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/layouts/${layout._id}`} className="flex items-center gap-1.5 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 text-sm">
                  <FiEdit size={14}/> Edit
                </Link>
                <button onClick={() => handleDeleteLayout(layout._id)} className="flex items-center gap-1.5 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 text-sm">
                  <FiTrash2 size={14}/> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Layout">
        <form onSubmit={handleAddLayout} className="space-y-4 pt-4">
          <div>
            <label htmlFor="layoutName" className="block text-sm font-medium mb-1 text-gray-700">Layout Name</label>
            <input
              type="text" id="layoutName" value={newLayoutName}
              onChange={(e) => setNewLayoutName(e.target.value)} required
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label htmlFor="layoutDesc" className="block text-sm font-medium mb-1 text-gray-700">Description</label>
            <textarea
              id="layoutDesc" value={newLayoutDesc}
              onChange={(e) => setNewLayoutDesc(e.target.value)} rows="3"
              className="w-full p-2 border rounded-md"
            ></textarea>
          </div>
          <div className="flex justify-center pt-4">
            <button type="submit" className="w-full px-4 py-2.5 bg-blue-800 text-white rounded-lg hover:bg-blue-900">
              Create New Layout
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LayoutsPage;