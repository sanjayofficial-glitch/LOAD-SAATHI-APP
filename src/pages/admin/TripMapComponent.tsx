import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip, Shipment } from '@/types';

// Coordinate cache to avoid redundant lookups and respect API limits
const coordCache: Record<string, [number, number]> = {
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946],
  'hyderabad': [17.3850, 78.4867],
  'ahmedabad': [23.0225, 72.5714],
  'chennai': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567],
};

// Helper to add a slight random jitter to coordinates to prevent exact overlapping
const applyJitter = (coord: [number, number], index: number): [number, number] => {
  const jitter = 0.015; // Roughly 1.5km offset
  const angle = (index * 137.5) % 360; 
  const rad = (angle * Math.PI) / 180;
  const offsetLat = Math.sin(rad) * (jitter * (1 + (index % 5) * 0.1));
  const offsetLon = Math.cos(rad) * (jitter * (1 + (index % 5) * 0.1));
  return [coord[0] + offsetLat, coord[1] + offsetLon];
};

// Geocoding function using Nominatim
async function getCityCoords(city: string): Promise<[number, number] | null> {
  const normalized = city.toLowerCase().trim();
  if (coordCache[normalized]) return coordCache[normalized];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      coordCache[normalized] = coords;
      return coords;
    }
  } catch (error) {
    console.error(`Geocoding error for ${city}:`, error);
  }
  return null;
}

// Custom icons
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const boxIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const flagIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233005.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

interface ExtendedTrip extends Omit<Trip, 'trucker'> {
  trucker?: { full_name: string };
}

interface ExtendedShipment extends Omit<Shipment, 'shipper'> {
  shipper?: { full_name: string };
}

interface TripMapProps {
  trips: ExtendedTrip[];
  shipments: ExtendedShipment[];
}

const TripMap: React.FC<TripMapProps> = ({ trips, shipments }) => {
  const [resolvedTrips, setResolvedTrips] = useState<any[]>([]);
  const [resolvedShipments, setResolvedShipments] = useState<any[]>([]);
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  useEffect(() => {
    const resolveData = async () => {
      // Resolve trips
      const tripPromises = trips
        .filter(t => t.status !== 'cancelled')
        .map(async (trip, idx) => {
          const origin = await getCityCoords(trip.origin_city);
          const dest = await getCityCoords(trip.destination_city);
          if (origin && dest) {
            return {
              ...trip,
              origin: applyJitter(origin, idx),
              destination: applyJitter(dest, idx + 100)
            };
          }
          return null;
        });

      // Resolve shipments
      const shipmentPromises = shipments
        .filter(s => s.status !== 'cancelled')
        .map(async (ship, idx) => {
          const origin = await getCityCoords(ship.origin_city);
          const dest = await getCityCoords(ship.destination_city);
          if (origin && dest) {
            return {
              ...ship,
              origin: applyJitter(origin, idx + 500),
              destination: applyJitter(dest, idx + 600)
            };
          }
          return null;
        });

      const rTrips = (await Promise.all(tripPromises)).filter(Boolean);
      const rShipments = (await Promise.all(shipmentPromises)).filter(Boolean);
      
      setResolvedTrips(rTrips);
      setResolvedShipments(rShipments);
    };

    resolveData();
  }, [trips, shipments]);

  return (
    <div className="h-full w-full bg-slate-900 border border-slate-800 overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ height: '100%', width: '100%', background: '#020617' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Trucker Trips - Orange lines */}
        {resolvedTrips.map((trip) => (
          <React.Fragment key={`trip-${trip.id}`}>
            <Marker position={trip.origin} icon={truckIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">Trucker Origin</p>
                  <p className="text-sm font-bold text-slate-800">{trip.trucker?.full_name || 'Anonymous Trucker'}</p>
                  <p className="text-[10px] text-slate-500">{trip.origin_city}</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={trip.destination} icon={flagIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">Destination</p>
                  <p className="text-sm font-bold text-slate-800">{trip.destination_city}</p>
                </div>
              </Popup>
            </Marker>
            <Polyline
              positions={[trip.origin, trip.destination]}
              pathOptions={{ 
                color: '#f97316', 
                weight: 2, 
                dashArray: '8, 12',
                opacity: 0.6
              }}
            />
          </React.Fragment>
        ))}

        {/* Shipper Shipments - Blue lines */}
        {resolvedShipments.map((shipment) => (
          <React.Fragment key={`shipment-${shipment.id}`}>
            <Marker position={shipment.origin} icon={boxIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Shipper Origin</p>
                  <p className="text-sm font-bold text-slate-800">{shipment.shipper?.full_name || 'Anonymous Shipper'}</p>
                  <p className="text-[10px] text-slate-500">{shipment.origin_city}</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={shipment.destination} icon={flagIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Destination</p>
                  <p className="text-sm font-bold text-slate-800">{shipment.destination_city}</p>
                </div>
              </Popup>
            </Marker>
            <Polyline
              positions={[shipment.origin, shipment.destination]}
              pathOptions={{ 
                color: '#3b82f6', 
                weight: 2, 
                dashArray: '8, 12',
                opacity: 0.6
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};

export default TripMap;