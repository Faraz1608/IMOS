import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore.js';
import { getLocationsByLayout, createLocation } from '../services/locationService.js';
import Modal from '../components/modal.jsx';

const LocationsPage = () => {
  const { layoutId } = useParams();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLocationCode, setNewLocationCode] = useState('');
  const { token } = useAuthStore();

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await getLocationsByLayout(layoutId, token);
      setLocations(response.data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [layoutId, token]);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      await createLocation(layoutId, { locationCode: newLocationCode }, token);
      setIsModalOpen(false);
      setNewLocationCode('');
      fetchLocations(); // Refresh the list
    } catch (error)      {
      console.error('Failed to create location:', error);
      alert('Failed to create location.');
    }
  };

  if (loading) {
    return <div>Loading locations...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Locations</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Add New Location
        </button>
      </div>
      <div className="bg-white shadow rounded-lg">
        <ul className="divide-y divide-gray-200">
          {locations.length > 0 ? (
            locations.map((location) => (
              <li key={location._id} className="p-4">
                <p className="text-lg font-mono">{location.locationCode}</p>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-gray-500">
              No locations found. Click "Add New Location" to get started.
            </li>
          )}
        </ul>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Location">
        <form onSubmit={handleAddLocation}>
          <div className="mb-4">
            <label htmlFor="locationCode" className="block text-sm font-medium text-gray-700">Location Code (e.g., A01-R01-S01)</label>
            <input
              type="text"
              id="locationCode"
              value={newLocationCode}
              onChange={(e) => setNewLocationCode(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            />
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

export default LocationsPage;