import React, { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

const UtilizationTable = ({ data }) => {
    const [expandedLayouts, setExpandedLayouts] = useState({});

    const toggleLayout = (layoutId) => {
        setExpandedLayouts(prev => ({
            ...prev,
            [layoutId]: !prev[layoutId]
        }));
    };

    // Helper to format volume numbers
    const formatVol = (val) => {
        if (!val) return '0';
        // Convert cm³ to m³ for display if large, or keep as is? 
        // Let's display in m³ for readability (1 m³ = 1,000,000 cm³)
        const m3 = val / 1000000;
        return m3.toFixed(3);
    };

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Layout / Location</th>
                        <th scope="col" className="px-6 py-3">Capacity (m³)</th>
                        <th scope="col" className="px-6 py-3">Used (m³)</th>
                        <th scope="col" className="px-6 py-3">Unutilized (m³)</th>
                        <th scope="col" className="px-6 py-3">Utilization %</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((layout) => (
                        <React.Fragment key={layout.id}>
                            {/* Layout Row */}
                            <tr
                                className="bg-gray-100 border-b hover:bg-gray-200 cursor-pointer font-semibold"
                                onClick={() => toggleLayout(layout.id)}
                            >
                                <td className="px-6 py-4 flex items-center gap-2 text-gray-900">
                                    {expandedLayouts[layout.id] ? <FiChevronDown /> : <FiChevronRight />}
                                    {layout.name}
                                </td>
                                <td className="px-6 py-4">{formatVol(layout.capacity)}</td>
                                <td className="px-6 py-4">{formatVol(layout.occupied)}</td>
                                <td className="px-6 py-4">{formatVol(layout.capacity - layout.occupied)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-300 rounded-full h-2.5 max-w-[100px]">
                                            <div
                                                className={`h-2.5 rounded-full ${layout.utilization > 90 ? 'bg-red-600' : layout.utilization > 70 ? 'bg-yellow-400' : 'bg-green-600'}`}
                                                style={{ width: `${layout.utilization}%` }}
                                            ></div>
                                        </div>
                                        <span>{layout.utilization}%</span>
                                    </div>
                                </td>
                            </tr>

                            {/* Location Rows (Expanded) */}
                            {expandedLayouts[layout.id] && layout.locations.map(loc => (
                                <tr key={loc.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-3 pl-12 text-gray-700">
                                        {loc.code}
                                    </td>
                                    <td className="px-6 py-3">{formatVol(loc.capacity)}</td>
                                    <td className="px-6 py-3">{formatVol(loc.occupied)}</td>
                                    <td className="px-6 py-3">{formatVol(loc.unutilized)}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                                                <div
                                                    className={`h-1.5 rounded-full ${loc.utilization > 90 ? 'bg-red-500' : loc.utilization > 70 ? 'bg-yellow-400' : 'bg-green-500'}`}
                                                    style={{ width: `${loc.utilization}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs">{loc.utilization}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UtilizationTable;
