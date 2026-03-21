import React from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Truck className="h-16 w-16 text-orange-600 mb-4" />
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-gray-600 mb-8 text-center">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/">
        <Button className="bg-orange-600 hover:bg-orange-700">Go Home</Button>
      </Link>
    </div>
  );
};

export default NotFound;