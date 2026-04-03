"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MissingClerkKey = () => {
  const [showForm, setShowForm] = useState(true);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setShowForm(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          Clerk Integration Required
        </h1>
        <p className="text-gray-600 text-center mb-6">
          To use LoadSaathi, you need to configure your Clerk publishable key.
          This key is used for authentication and must be set in your .env file.
        </p>
        
        {showForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email (for demonstration only)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Set Up Clerk
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="bg-orange-100 p-4 rounded-lg mb-4">
              <p className="text-orange-800">⚠️</p>
              <p className="text-lg font-medium">Clerk setup in progress...</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
            <div className="animate-pulse rounded-full h-8 w-8 mx-auto mb-4"></div>
            <p className="text-gray-500">Please wait...</p>
          </div>
        )}
        
        {!showForm && (
          <div className="text-center">
            <p className="text-green-600">✅ Clerk configuration successful!</p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissingClerkKey;