import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { getLayoutById, updateLayout } from '../services/layoutService';
import { useForm } from '../hooks/useForm'; // Import the custom hook

const LayoutDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [layout, setLayout] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await getLayoutById(id, token);
        setLayout(res.data);
      } catch (error) {
        console.error("Failed to fetch layout", error);
        toast.error("Could not load layout details.");
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [id, token]);

  const handleChange = (e) => {
    setLayout({ ...layout, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateLayout(id, { name: layout.name, description: layout.description }, token);
      toast.success('Layout updated successfully!');
      navigate('/layouts');
    } catch (error) {
      console.error("Failed to update layout", error);
      toast.error('Failed to update layout.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Layout</h1>
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow space-y-4 max-w-lg">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Layout Name</label>
          <input
            type="text" id="name" name="name"
            value={layout.name} onChange={handleChange}
            required className="mt-1 block w-full p-2 border rounded-md"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium">Description</label>
          <textarea
            id="description" name="description"
            value={layout.description} onChange={handleChange}
            rows="3" className="mt-1 block w-full p-2 border rounded-md"
          ></textarea>
        </div>
        <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigate('/layouts')} className="px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Save Changes
            </button>
        </div>
      </form>
    </div>
  );
};

export default LayoutDetailPage;