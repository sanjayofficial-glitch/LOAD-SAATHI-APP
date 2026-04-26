"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';
import { Trip, Shipment } from '@/types';

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

const truckIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png', iconSize: [24, 24], iconAnchor: [12, 12] });
const boxIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png', iconSize: [24, 24], iconAnchor: [12, 12] });
const flagIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233005.png', iconSize: [24, 24], iconAnchor: [12, 24] });

const TripMap: React.FC<{ trips: any[]; shipments: any[] }> = ({ trips, shipments }) => {
  const [resolvedTrips, setResolvedTrips] = useState<any[]>([]);
  const [resolvedShipments, setResolvedShipments] = useState<any[]>([]);
  const [resolving, setResolving] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const processData = async () => {
      setResolving(true);
      
      const tripsResult: any[] = [];
      const shipmentsResult: any[] = [];

      // Process Trips
      for (let i = 0; i < trips.length; i++) {
        if (!isMounted.current) break;
        const trip = trips[i];
        if (trip.status === 'cancelled') continue;
        
        const origin = await getCityCoords(trip.origin_city);
        const dest = await getCityCoords(trip.destination_city);

        if (origin && dest) {
          tripsResult.push({ 
            ...trip, 
            origin: applyJitter(origin, i), 
            destination: applyJitter(dest, i + 50) 
          });
          setResolvedTrips([...tripsResult]);
        }
        if (!coordCache[trip.origin_city.toLowerCase()]) await sleep(1000); // Wait for new geocodes
      }

      // Process Shipments
      for (let i = 0; i < shipments.length; i++) {
        if (!isMounted.current) break;
        const ship = shipments[i];
        if (ship.status === 'cancelled') continue;

        const origin = await getCityCoords(ship.origin_city);
        const dest = await getCityCoords(ship.destination_city);

        if (origin && dest) {
          shipmentsResult.push({ 
            ...ship, 
            origin: applyJitter(origin, i + 100), 
            destination: applyJitter(dest, i + 150) 
          });
          setResolvedShipments([...shipmentsResult]);
        }
        if (!coordCache[ship.origin_city.toLowerCase()]) await sleep(1000);
      }

      setResolving(false);
    };

    processData();
    return () => { isMounted.current = false; };
  }, [trips.length, shipments.length]);

  return (
    <div className="h-full w-full bg-slate-900 border border-slate-800 overflow-hidden relative">
      <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', background: '#020617' }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OSM' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
        {resolvedTrips.map((trip) => (
          <React.Fragment key={`trip-${trip.id}`}>
            <Marker position={trip.origin} icon={truckIcon}>
              <Popup className="dark-popup">
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-orange-500 mb-1">Trucker Origin</p>
                  <p className="text-sm font-bold text-slate-800">{trip.trucker?.full_name || 'Carrier'}</p>
                  <p className="text-[10px] text-slate-500">{trip.origin_city}</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={trip.destination} icon={flagIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-orange-500 mb-1">Destination</p>
                  <p className="text-sm font-bold text-slate-800">{trip.destination_city}</p>
                </div>
              </Popup>
            </Marker>
            <Polyline 
              positions={[trip.origin, trip.destination]} 
              pathOptions={{ color: '#f97316', weight: 1.5, dashArray: '8, 12', opacity: 0.5 }} 
            />
          </React.Fragment>
        ))}

        {resolvedShipments.map((shipment) => (
          <React.Fragment key={`shipment-${shipment.id}`}>
            <Marker position={shipment.origin} icon={boxIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-blue-500 mb-1">Load Origin</p>
                  <p className="text-sm font-bold text-slate-800">{shipment.shipper?.full_name || 'Shipper'}</p>
                  <p className="text-[10px] text-slate-500">{shipment.origin_city}</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={shipment.destination} icon={flagIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-blue-500 mb-1">Destination</p>
                  <p className="text-sm font-bold text-slate-800">{shipment.destination_city}</p>
                </div>
              </Popup>
            </Marker>
            <Polyline 
              positions={[shipment.origin, shipment.destination]} 
              pathOptions={{ color: '#3b82f6', weight: 1.5, dashArray: '8, 12', opacity: 0.5 }} 
            />
          </React.Fragment>
        ))}
      </MapContainer>

      {resolving && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-slate-950/90 border border-slate-800 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl">
          <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
            Mapping Flows ({resolvedTrips.length + resolvedShipments.length})
          </span>
        </div>
      )}
    </div>
  );
};

export default TripMap;