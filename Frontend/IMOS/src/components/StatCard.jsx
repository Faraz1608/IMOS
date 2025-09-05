import React from 'react';

const StatCard = ({ icon, title, value, colorClass = 'bg-emerald-500', subtitle }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
      <div className={`p-3 rounded-full ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;