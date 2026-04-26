"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Ensure this import is present
import { Loader2, Truck, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// City coordinate cache for Indian cities
const coordCache: Record<string, [number, number]> = {
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'hyderabad': [17.3850, 78.4867],
  'ahmedabad': [23.0225, 72.5714],
  'chennai': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567],
  'jaipur': [26.9124, 75.7873],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'nagpur': [21.1458, 79.0882],
  'indore': [22.7196, 75.8577],
  'thane': [19.2183, 72.9781],
  'bhopal': [23.2599, 77.4126],
  'visakhapatnam': [17.6868, 83.2185],
  'patna': [25.5941, 85.1376],
  'vadodara': [22.3072, 73.1812],
  'ghaziabad': [28.6692, 77.4538],
  'ludhiana': [30.9010, 75.8573],
  'agra': [27.1767, 78.0081],
  'nashik': [19.9975, 73.7898],
  'ranchi': [23.3441, 85.3096],
  'jamshedpur': [22.8046, 86.2029],
  'dhanbad': [23.7957, 86.4304],
  'gurugram': [28.4595, 77.0266],
  'noida': [28.5355, 77.3910],
  'surat': [21.1702, 72.8311],
  'bhubaneswar': [20.2961, 85.8245],
  'guwahati': [26.1445, 91.7362],
  'chandigarh': [30.7333, 76.7794],
  'mysore': [12.2958, 76.6394],
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const applyJitter = (coord: [number, number], index: number): [number, number] => {
  const jitter = 0.015;
  const angle = (index * 137.5) % 360;
  const rad = (angle * Math.PI) / 180;
  return [coord[0] + Math.sin(rad) * jitter, coord[1] + Math.cos(rad) * jitter];
};

async function getCityCoords(city: string): Promise<[number, number] | null> {
  if (!city) return null;
  const normalized = city.toLowerCase().trim();
  if (coordCache[normalized]) return coordCache[normalized];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1`,
      { headers: { 'User-Agent': 'LoadSaathi-Admin/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      coordCache[normalized] = coords;
      return coords;
    }
  } catch (err) {
    console.error(`Geocode error: ${city}`, err);
  }
  return null;
}

// Leaflet divIcon creators for reliable rendering
const createTripIcon = (color: string) => L.divIcon({
  className: 'custom-trip-icon',
  html: `<div style="width:28px;height:28px;transform:translate(-50%,-50%)">
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="${color}" stroke-width="2">
      <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/>
      <circle cx="5" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
      <path d="M5 9l-1 4h12l-1-4"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const createLoadIcon = (color: string) => L.divIcon({
  className: 'custom-load-icon',
  html: `<div style="width:28px;height:28px;transform:translate(-50%,-50%)">
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="${color}" stroke-width="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4a2 2 0 0 0 2 0l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const createOriginIcon = (color: string) => L.divIcon({
  className: 'custom-origin-icon',
  html: `<div style="width:24px;height:24px;transform:translate(-50%,-50%)">
    <svg viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.8"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const createDestinationIcon = (color: string) => L.divIcon({
  className: 'custom-destination-icon',
  html: `<div style="width:24px;height:24px;transform:translate(-50%,-50%)">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${color}" stroke-width="2">
      <circle cx="12" cy="12" r="10" stroke="${color}" fill="none"/>
      <circle cx="12" cy="12" r="4" fill="${color}" opacity="0.6"/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const TripMap = () => {
  // Initialize state variables
  const [trips, setTrips] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [resolvedTrips, setResolvedTrips] = useState<any[]>([]);
  const [resolvedShipments, setResolvedShipments] = useState<any[]>([]);
  const [resolving, setResolving] = useState(false);
  const isMounted = useRef(true);

  // Counts for legend (matches Business Performance)
  const [totalTrips, setTotalTrips] = useState<number>(0);
  const [totalLoads, setTotalLoads] = useState<number>(0);

  // Fetch trip and shipment data from Supabase
  useEffect(() => {
    isMounted.current = true;
    const fetchData = async () => {
      setLoadingData(true);
      try {
        // Fetch active trips (exclude cancelled, match Business Performance filters)
        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('*, trucker:users(full_name)')
          .neq('status', 'cancelled');

        if (tripsError) console.error('Trip fetch error:', tripsError);
        else if (isMounted.current) setTrips(tripsData || []);

        // Fetch active shipments (exclude cancelled, match Business Performance filters)
        const { data: shipmentsData, error: shipmentsError } = await supabase
          .from('shipments')
          .select('*, shipper:users(full_name)')
          .neq('status', 'cancelled');

        if (shipmentsError) console.error('Shipment fetch error:', shipmentsError);
        else if (isMounted.current) setShipments(shipmentsData || []);
      } finally {
        if (isMounted.current) setLoadingData(false);
      }
    };

    fetchData();
    return () => { isMounted.current = false; };
  }, []);

  // Process trips and shipments to resolve coordinates
  useEffect(() => {
    isMounted.current = true;
    const processData = async () => {
      if (loadingData) return;
      setResolving(true);
      const tripsResult: any[] = [];
      const shipmentsResult: any[] = [];

      // Process trips
      for (let i = 0; i < trips.length; i++) {
        if (!isMounted.current) break;
        const trip = trips[i];
        const origin = await getCityCoords(trip.origin_city);
        const dest = await getCityCoords(trip.destination_city);

        if (origin && dest) {
          tripsResult.push({
            ...trip,
            origin: applyJitter(origin, i),
            destination: applyJitter(dest, i + 50)
          });
          if (isMounted.current) setTotalTrips(tripsResult.length);
        }
        if (!coordCache[trip.origin_city?.toLowerCase()]) await sleep(1000);
      }

      // Process shipments
      for (let i = 0; i < shipments.length; i++) {
        if (!isMounted.current) break;
        const shipment = shipments[i];
        const origin = await getCityCoords(shipment.origin_city);
        const dest = await getCityCoords(shipment.destination_city);

        if (origin && dest) {
          shipmentsResult.push({
            ...shipment,
            origin: applyJitter(origin, i + 100),
            destination: applyJitter(dest, i + 150)
          });
          if (isMounted.current) setTotalLoads(shipmentsResult.length);
        }
        if (!coordCache[shipment.origin_city?.toLowerCase()]) await sleep(1000);
      }

      if (isMounted.current) {
        setResolvedTrips(tripsResult);
        setResolvedShipments(shipmentsResult);
        setResolving(false);
      }
    };

    processData();
    return () => { isMounted.current = false; };
  }, [trips, shipments, loadingData]);

  const Legend = () => (
    <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-2xl">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Route Summary</div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-2 py-1 bg-orange-50 rounded">
          <Truck className="h-5 w-5 text-orange-600" />
          <span className="text-xs font-medium text-orange-500">Trips: {totalTrips}</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded">
          <Package className="h-5 w-5 text-blue-600" />
          <span className="text-xs font-medium text-blue-500">Loads: {totalLoads}</span>
        </div>
      </div>
    </div>
  );

  if (loadingData || resolving) {
    return (
      <div className="h-full w-full bg-slate-950 border border-slate-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <span className="ml-2 text-slate-400">Loading route data...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-950 border border-slate-800 overflow-hidden relative">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%', background: '#020617' }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {resolvedTrips.map((trip) => (
          <React.Fragment key={`trip-${trip.id}`}>
            <Marker position={trip.origin} icon={createOriginIcon('#f97316')}>
              <Popup>
                <div className="p-2 bg-slate-900 border border-slate-700 min-w-[200px]">
                  <p className="text-[10px] font-bold uppercase text-orange-400">Trip Origin</p>
                  <p className="text-sm font-semibold text-slate-100">{trip.trucker?.full_name || 'Carrier'}</p>
                  <p className="text-xs text-slate-400">{trip.origin_city}</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={trip.destination} icon={createDestinationIcon('#f97316')}>
              <Popup>
                <div className="p-2 bg-slate-900 border border-slate-700 min-w-[200px]">
                  <p className="text-[10px] font-bold uppercase text-orange-400">Trip Destination</p>
                  <p className="text-sm font-semibold text-slate-100">{trip.destination_city}</p>
                </div>
              </Popup>
            </Marker>
            <Polyline
              positions={[trip.origin, trip.destination]}
              pathOptions={{ color: '#f97316', weight: 3, opacity: 0.8, dashArray: '10, 10' }}
            />
            <Marker
              position={[(trip.origin[0] + trip.destination[0]) / 2, (trip.origin[1] + trip.destination[1]) / 2]}
              icon={createTripIcon('#f97316')}
            >
              <Popup>
                <div className="p-2 bg-slate-900 border border-slate-700 min-w-[200px]">
                  <p className="text-[10px] font-bold uppercase text-orange-400">Active Trip</p>
                  <p className="text-sm font-semibold text-slate-100">{trip.origin_city} → {trip.destination_city}</p>
                  <p className="text-xs text-slate-400 mt-1">Capacity: {trip.available_capacity_tonnes}t</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {resolvedShipments.map((shipment) => (
          <React.Fragment key={`shipment-${shipment.id}`}>
            <Marker position={shipment.origin} icon={createOriginIcon('#3b82f6')}>
              <Popup>
                <div className="p-2 bg-slate-900 border border-slate-700 min-w-[200px]">
                  <p className="text-[10px] font-bold uppercase text-blue-400">Load Origin</p>
                  <p className="text-sm font-semibold text-slate-100">{shipment.shipper?.full_name || 'Shipper'}</p>
                  <p className="text-xs text-slate-400">{shipment.origin_city}</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={shipment.destination} icon={createDestinationIcon('#3b82f6')}>
              <Popup>
                <div className="p-2 bg-slate-900 border border-slate-700 min-w-[200px]">
                  <p className="text-[10px] font-bold uppercase text-blue-400">Load Destination</p>
                  <p className="text-sm font-semibold text-slate-100">{shipment.destination_city}</p>
                </div>
              </Popup>
            </Marker>
            <Polyline
              positions={[shipment.origin, shipment.destination]}
              pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8, dashArray: '5, 5' }}
            />
            <Marker
              position={[(shipment.origin[0] + shipment.destination[0]) / 2, (shipment.origin[1] + shipment.destination[1]) / 2]}
              icon={createLoadIcon('#3b82f6')}
            >
              <Popup>
                <div className="p-2 bg-slate-900 border border-slate-700 min-w-[200px]">
                  <p className="text-[10px] font-bold uppercase text-blue-400">Load Request</p>
                  <p className="text-sm font-semibold text-slate-100">{shipment.origin_city} → {shipment.destination_city}</p>
                  <p className="text-xs text-slate-400 mt-1">Weight: {shipment.weight_tonnes}t</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        <Legend />
      </MapContainer>
    </div>
  );
};

export default TripMap;