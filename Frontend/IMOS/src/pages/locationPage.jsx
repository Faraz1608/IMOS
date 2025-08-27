import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import { getLocationsByLayout, createLocation, updateLocation, deleteLocation } from '../services/locationService.js';
import Modal from '../components/modal.jsx';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';

const LocationsPage = () => {
  const { layoutId } = useParams();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationCode, setLocationCode] = useState('');
  const { token } = useAuthStore();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await getLocationsByLayout(layoutId, token);
      setLocations(response.data);
    } catch (error) { toast.error('Could not fetch locations.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchLocations(); }, [layoutId, token]);

  const openAddModal = () => {
    setModalMode('add'); setLocationCode('');
    setCurrentLocation(null); setIsModalOpen(true);
  };

  const openEditModal = (location) => {
    setModalMode('edit'); setLocationCode(location.locationCode);
    setCurrentLocation(location); setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const action = modalMode === 'add'
      ? createLocation(layoutId, { locationCode }, token)
      : updateLocation(layoutId, currentLocation._id, { locationCode }, token);
    try {
      await action;
      toast.success(`Location ${modalMode === 'add' ? 'created' : 'updated'}!`);
      setIsModalOpen(false); fetchLocations();
    } catch (error) { toast.error(`Failed to ${modalMode} location.`); }
  };

  const handleDelete = async (locationId) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteLocation(layoutId, locationId, token);
        toast.success('Location deleted.'); fetchLocations();
      } catch (error) { toast.error('Failed to delete location.'); }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Locations</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
             <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
             <input type="text" placeholder="Search Location" className="w-full max-w-xs p-2 pl-10 border rounded-lg"/>
           </div>
          <button onClick={openAddModal} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <FiPlus /> Add Location
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {loading ? <p>Loading...</p> : (
          locations.length > 0 ? (
            locations.map((location) => (
              <div key={location._id} className="p-4 bg-purple-50 rounded-lg flex justify-between items-center border border-purple-100">
                <p className="font-mono text-gray-800">{location.locationCode}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(location)} className="p-2 text-blue-600 rounded-lg hover:bg-blue-100"><FiEdit size={16}/></button>
                  <button onClick={() => handleDelete(location._id)} className="p-2 text-red-600 rounded-lg hover:bg-red-100"><FiTrash2 size={16}/></button>
                </div>
              </div>
            ))
          ) : ( <p className="text-center text-gray-500 py-8">No locations found.</p> )
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Create New Location' : 'Edit Location'}>
        <form onSubmit={handleModalSubmit} className="pt-4 space-y-4">
          <div>
            <label htmlFor="locationCode" className="block text-sm font-medium mb-1">Location Code (e.g. A01-R01-S01)</label>
            <input type="text" id="locationCode" value={locationCode} onChange={(e) => setLocationCode(e.target.value)} required className="w-full p-2 border rounded-md"/>
          </div>
          <div className="flex justify-center pt-4">
            <button type="submit" className="w-full px-4 py-2.5 bg-blue-800 text-white rounded-lg">{modalMode === 'add' ? 'Create New Location' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LocationsPage;