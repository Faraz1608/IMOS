import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import { getLocationsByLayout, createLocation, updateLocation, deleteLocation } from '../services/locationService.js';
import Modal from '../components/modal.jsx';
import { FiPlus, FiEdit3, FiTrash2 } from 'react-icons/fi';

const LocationsPage = () => {
  const { layoutId } = useParams();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationCode, setLocationCode] = useState('');
  const { token } = useAuthStore();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await getLocationsByLayout(layoutId, token);
      setLocations(response.data);
    } catch (error) {
      toast.error('Could not fetch locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [layoutId, token]);

  const openAddModal = () => {
    setModalMode('add');
    setLocationCode('');
    setCurrentLocation(null);
    setIsModalOpen(true);
  };

  const openEditModal = (location) => {
    setModalMode('edit');
    setLocationCode(location.locationCode);
    setCurrentLocation(location);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const action = modalMode === 'add'
      ? createLocation(layoutId, { locationCode }, token)
      : updateLocation(layoutId, currentLocation._id, { locationCode }, token);

    try {
      await action;
      toast.success(`Location ${modalMode === 'add' ? 'created' : 'updated'} successfully!`);
      setIsModalOpen(false);
      fetchLocations();
    } catch (error) {
      toast.error(`Failed to ${modalMode} location.`);
    }
  };

  const handleDelete = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await deleteLocation(layoutId, locationId, token);
        toast.success('Location deleted successfully.');
        fetchLocations();
      } catch (error) {
        toast.error('Failed to delete location.');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Locations</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <FiPlus /> Add Location
        </button>
      </div>
      
      <div className="space-y-3">
        {loading ? <p>Loading...</p> : (
          locations.length > 0 ? (
            locations.map((location) => (
              <div key={location._id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center border">
                <p className="font-mono text-gray-800">{location.locationCode}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(location)} className="p-2 text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200">
                    <FiEdit3 />
                  </button>
                  <button onClick={() => handleDelete(location._id)} className="p-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-8">No locations found.</p>
          )
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Create New Location' : 'Edit Location'}>
        <form onSubmit={handleModalSubmit}>
          <div className="mb-4">
            <label htmlFor="locationCode" className="block text-sm font-medium mb-1">Location Code</label>
            <input
              type="text" id="locationCode" value={locationCode}
              onChange={(e) => setLocationCode(e.target.value)}
              required className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg">{modalMode === 'add' ? 'Create' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LocationsPage;