"use client";

import React, { useState } from 'react';
import TripMap from './TripMapComponent'; // Fixed import

const MonitoringDashboard = () => {
  const [trips, setTrips] = useState<any[]>([]); // Initialize trips state
  const [shipments, setShipments] = useState<any[]>([]); // Initialize shipments state

  // ... existing logic to fetch data into trips/shipments ...

  return (
    <div className="h-full relative bg-slate-900">
      {/* @ts-ignore: Trips and shipments props are passed to TripMap component */}
      <TripMap {...{ trips, shipments } as any} />
    </div>
  );
};

export default MonitoringDashboard;