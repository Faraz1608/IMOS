import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe } from 'react-icons/fi';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="flex items-center space-x-2">
            <FiGlobe className="text-gray-200" />
            <select
                onChange={(e) => changeLanguage(e.target.value)}
                value={i18n.language}
                className="bg-blue-800 text-white text-sm rounded-md px-2 py-1 border-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
                <option value="en">English</option>
                <option value="mr">मराठी</option>
                <option value="hi">हिंदी</option>
            </select>
        </div>
    );
};

export default LanguageSwitcher;
