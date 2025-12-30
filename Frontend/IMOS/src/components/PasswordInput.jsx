import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const PasswordInput = ({ id, name, value, onChange, placeholder, required = false, className = '', leftIcon }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">{leftIcon}</div>
      )}
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        required={required}
        placeholder={placeholder}
        className={`w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${className}`}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow((s) => !s)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
      >
        {show ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
};

export default PasswordInput;
