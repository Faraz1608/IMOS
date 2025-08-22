import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore.js';
import { search } from '../services/searchService.js';

const SearchPage = () => {
  const { token } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState(
    JSON.parse(localStorage.getItem('searchHistory')) || []
  );

  // Debounced search effect
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      const fetchSuggestions = async () => {
        try {
          const res = await search(searchTerm, token);
          setSuggestions(res.data);
        } catch (error) {
          console.error('Failed to fetch search suggestions', error);
        }
      };
      fetchSuggestions();
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, token]);
  
  const handleSearchSubmit = (term) => {
    // Add to history if it's not a duplicate
    if (term && !searchHistory.includes(term)) {
      const updatedHistory = [term, ...searchHistory].slice(0, 5); // Keep last 5
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    }
    setSearchTerm(term);
    setSuggestions([]); // Hide suggestions after selection
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Search</h1>
      <div className="relative max-w-lg mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search SKUs or Locations..."
          className="w-full p-2 border rounded-md"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            {suggestions.map((s) => (
              <li
                key={s.id}
                onClick={() => handleSearchSubmit(s.name)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {s.name} <span className="text-xs text-gray-500">({s.type})</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Recent Searches</h2>
        {searchHistory.length > 0 ? (
          <ul className="mt-2">
            {searchHistory.map((item, index) => (
              <li key={index} className="text-blue-600 hover:underline cursor-pointer" onClick={() => handleSearchSubmit(item)}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No recent searches.</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;