import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'green' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-8 w-8',
  };

  const colorClasses = {
    green: 'text-green-600',
    white: 'text-white',
    blue: 'text-green-600',
    gray: 'text-gray-600',
  };

  return (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const LoadingButton = ({ loading, children, ...props }) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${props.className} ${loading ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <LoadingSpinner size="small" color="white" />
          <span className="ml-2">Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      <div className="bg-white rounded-xl p-6 flex items-center space-x-3 shadow-2xl transform transition-all duration-300 scale-100 opacity-100">
        <LoadingSpinner size="large" color="green" />
        <span className="text-lg font-medium">{message}</span>
      </div>
    </div>
  );
};

export { LoadingSpinner, LoadingButton, LoadingOverlay };
export default LoadingSpinner;
