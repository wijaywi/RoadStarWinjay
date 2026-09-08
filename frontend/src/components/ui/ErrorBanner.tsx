import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ErrorBanner: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded-r-md shadow-sm">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
        <p className="text-red-700 font-medium">{message}</p>
      </div>
    </div>
  );
};
