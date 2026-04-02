"use client";

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      navigate('/', { replace: true });
    }, 10000);    
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
          <Link to="/">
            <Button className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg font-medium transition-colors">
              Go Home
            </Button>
          </Link>
          
          <Link to="/login">
            <Button variant="outline" className="px-6 py-3 rounded-lg">
              Go to Login
            </Button>
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 mt-6">
          If you typed the URL manually, please check for typos or go back to the 
          <Link to="/" className="text-orange-600 hover:underline ml-1">homepage</Link>.
        </p>
      </div>
    </div>
  );
};

export default NotFound;