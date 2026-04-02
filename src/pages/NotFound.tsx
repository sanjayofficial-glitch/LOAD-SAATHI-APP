"use client";

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';

const NotFound = () => {
  const navigate = useNavigate();
  
  // Optional: redirect to home after a short delay if user doesn't click any link
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/', { replace: true });
    }, 10000); // 10 seconds    
    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <Truck className="h-16 w-16 text-orange-600 mb-6" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>
        
        <div className="space-y-4">
          <Button 
            to="/" 
            className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Home
          </Button>
          
          <Button 
            to="/dashboard" 
            className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-lg text-gray-800"
          >
            Browse Dashboard
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mt-6">
          If you typed the URL manually, please check for typos or go back to the 
          <Button to="/" className="underline hover:text-orange-600">homepage</Button>.
        </p>
      </div>
    </div>
  );
};

export default NotFound;