"use client";

import { Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

const UpdatePasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Truck className="h-12 w-12 text-orange-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Set New Password</h2>
          <p className="text-gray-600 mt-2">Please enter your new password</p>
        </div>
        
        <p className="text-center text-gray-600 mt-4">
          Remember your password? <Link to="/login" className="text-orange-600 font-medium hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;