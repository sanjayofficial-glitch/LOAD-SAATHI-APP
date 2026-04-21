"use client";

import { useState, useEffect } from 'react';

interface TripStatus {
  status: 'pending' | 'running' | 'completed';
}

export const useTripStatus = (initialStatus: TripStatus['status'] = 'pending'): {
  tripStatus: TripStatus['status'];
  setTripStatus: (status: TripStatus['status']) => void;
} => {
  const [tripStatus, setTripStatus] = useState<TripStatus['status']>(initialStatus);

  useEffect(() => {
    const savedStatus = localStorage.getItem('tripStatus');
    if (savedStatus) {
      setTripStatus(savedStatus as TripStatus['status']);
    }
  }, []);

  return {
    tripStatus,
    setTripStatus  };
};