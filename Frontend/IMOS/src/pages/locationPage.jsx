import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore.js';
import { getLocationsByLayout, createLocation, updateLocation, deleteLocation, getLocationStats } from '../services/locationService.js';
import Modal from '../components/modal.jsx';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiArchive } from 'react-icons/fi';
import io from 'socket.io-client';

const LocationsPage = () => {
  const { layoutId } = useParams();
  const [locations, setLocations] = useState([]);
  const [locationStats, setLocationStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentLocation, setCurrentLocation] = useState(null);
  
  const [locationCode, setLocationCode] = useState('');
  const [properties, setProperties] = useState({
    dimensions: { w: '', d: '', h: '' },
    weightCapacityKg: '',
  });


  const { token } = useAuthStore();

  const fetchLocationsAndStats = async () => {
    try {
      setLoading(true);
      const response = await getLocationsByLayout(layoutId, token);
      setLocations(response.data);

      const statsPromises = response.data.map(loc => getLocationStats(layoutId, loc._id, token));
      const statsResults = await Promise.all(statsPromises);
      
      const statsMap = statsResults.reduce((acc, result) => {
          acc[result.data.locationId] = result.data;
          return acc;
      }, {});
      setLocationStats(statsMap);

    } catch (error) { 
      toast.error('Could not fetch locations or their stats.');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchLocationsAndStats();

    const socket = io('http://localhost:7000');
    socket.on('locations_updated', () => {
        toast('Locations have been updated.', { icon: '🔄' });
        fetchLocationsAndStats();
    });
    socket.on('inventory_updated', () => {
        fetchLocationsAndStats();
    });
    return () => { socket.disconnect(); };
  }, [layoutId, token]);

  const handlePropertiesChange = (e) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');
    
    setProperties(prev => {
      if (child) {
        return { ...prev, [parent]: { ...prev[parent], [child]: value } };
      }
      return { ...prev, [name]: value };
    });
  };

  const resetFormState = () => {
    setLocationCode('');
    setProperties({
      dimensions: { w: '', d: '', h: '' },
      weightCapacityKg: '',
    });
    setCurrentLocation(null);
  };
  
  const openAddModal = () => {
    resetFormState();
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (location) => {
    resetFormState();
    setModalMode('edit');
    setCurrentLocation(location);
    setLocationCode(location.locationCode);
    setProperties(location.properties || { dimensions: { w: '', d: '', h: '' }, weightCapacityKg: '' });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const locationData = { locationCode, properties };
    
    const action = modalMode === 'add'
      ? createLocation(layoutId, locationData, token)
      : updateLocation(layoutId, currentLocation._id, locationData, token);
      
    try {
      await action;
      toast.success(`Location ${modalMode === 'add' ? 'created' : 'updated'}!`);
      setIsModalOpen(false);
    } catch (error) { 
      const errorMessage = error.response?.data?.message || `Failed to ${modalMode} location.`;
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (locationId) => {
    if (window.confirm('Are you sure? This will delete the location and all inventory within it.')) {
      try {
        await deleteLocation(layoutId, locationId, token);
        toast.success('Location deleted.');
      } catch (error) { 
        toast.error('Failed to delete location.'); 
      }
    }
  };
  
  const UtilizationBar = ({ utilization }) => {
    const percent = parseFloat(utilization) || 0;
    let bgColor = 'bg-green-500';
    if (percent > 75) bgColor = 'bg-yellow-500';
    if (percent > 90) bgColor = 'bg-red-500';

    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`${bgColor} h-2.5 rounded-full`} style={{ width: `${percent}%` }}></div>
        </div>
    );
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
              <div key={location._id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-mono font-bold text-gray-800">{location.locationCode}</p>
                        <p className="text-xs text-gray-500">
                            Dims: {location.properties?.dimensions?.w}x{location.properties?.dimensions?.d}x{location.properties?.dimensions?.h}cm | 
                            Max Weight: {location.properties?.weightCapacityKg}kg
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(location)} className="p-2 text-blue-600 rounded-lg hover:bg-blue-100"><FiEdit size={16}/></button>
                        <button onClick={() => handleDelete(location._id)} className="p-2 text-red-600 rounded-lg hover:bg-red-100"><FiTrash2 size={16}/></button>
                    </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                    <FiArchive className="text-gray-400" title="Space Utilization" />
                    <UtilizationBar utilization={locationStats[location._id]?.spaceUtilization} />
                    <span className="text-sm font-medium text-gray-600 w-16 text-right">{locationStats[location._id]?.spaceUtilization || '0.00%'}</span>
                </div>
              </div>
            ))
          ) : ( <p className="text-center text-gray-500 py-8">No locations found for this layout.</p> )
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? 'Create New Location' : 'Edit Location'}>
        <form onSubmit={handleModalSubmit} className="pt-4 space-y-4">
          <div>
            <label htmlFor="locationCode" className="block text-sm font-medium mb-1">Location Code (e.g. A01-R01-S01)</label>
            <input type="text" id="locationCode" value={locationCode} onChange={(e) => setLocationCode(e.target.value)} required className="w-full p-2 border rounded-md"/>
          </div>
          <fieldset className="border p-2 rounded-md">
            <legend className="text-sm font-medium px-1">Dimensions (m)</legend>
            <div className="grid grid-cols-3 gap-2">
                <input type="number" name="dimensions.w" value={properties.dimensions.w} onChange={handlePropertiesChange} placeholder="Width" className="w-full p-2 border rounded-md"/>
                <input type="number" name="dimensions.d" value={properties.dimensions.d} onChange={handlePropertiesChange} placeholder="Depth" className="w-full p-2 border rounded-md"/>
                <input type="number" name="dimensions.h" value={properties.dimensions.h} onChange={handlePropertiesChange} placeholder="Height" className="w-full p-2 border rounded-md"/>
            </div>
          </fieldset>
          <div>
            <label htmlFor="weightCapacityKg" className="block text-sm font-medium mb-1">Weight Capacity (Kg)</label>
            <input type="number" id="weightCapacityKg" name="weightCapacityKg" value={properties.weightCapacityKg} onChange={handlePropertiesChange} className="w-full p-2 border rounded-md"/>
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