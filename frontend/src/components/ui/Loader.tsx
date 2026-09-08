import React from 'react';

export const Loader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
      <p className="text-gray-500 font-medium">{text}</p>
    </div>
  );
};
