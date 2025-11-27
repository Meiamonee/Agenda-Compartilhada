import React from 'react';

export default function Input({
    label,
    error,
    className = '',
    id,
    ...props
}) {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`
          w-full px-4 py-2.5 rounded-lg border bg-white text-gray-900 placeholder-gray-400
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
          ${error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                    {error}
                </p>
            )}
        </div>
    );
}
