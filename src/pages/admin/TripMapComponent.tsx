import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip } from '@/types';

// Simple coordinate lookup for major Indian cities to visualize flow
const CITY_COORDS: Record<string, [number, number]> = {
  'Mumbai': [19.0760, 72.8777],
  'Delhi': [28.6139, 77.2090],
  'Bangalore': [12.9716, 77.5946],
  'Hyderabad': [17.3850, 78.4867],
  'Ahmedabad': [23.0225, 72.5714],
  'Chennai': [13.0827, 80.2707],
  'Kolkata': [22.5726, 88.3639],
  'Pune': [18.5204, 73.8567],
  'Jaipur': [26.9124, 75.7873],
  'Lucknow': [26.8467, 80.9462],
  'Kanpur': [26.4499, 80.3319],
  'Nagpur': [21.1458, 79.0882],
  'Indore': [22.7196, 75.8577],
  'Thane': [19.2183, 72.9781],
  'Bhopal': [23.2599, 77.4126],
  'Visakhapatnam': [17.6868, 83.2185],
  'Pimpri-Chinchwad': [18.6298, 73.7997],
  'Patna': [25.5941, 85.1376],
  'Vadodara': [22.3072, 73.1812],
  'Ghaziabad': [28.6692, 77.4538],
};

// Fix default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TripMap: React.FC<{ trips: Trip[] }> = ({ trips }) => {
  const activeTrips = trips.filter(trip => trip.status === 'active').slice(0, 15);
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  return (
    <div className="h-full w-full bg-slate-900">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ height: '100%', width: '100%', background: '#020617' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {activeTrips.map(trip => {
          const origin = CITY_COORDS[trip.origin_city] || defaultCenter;
          const destination = CITY_COORDS[trip.destination_city] || [defaultCenter[0] + 2, defaultCenter[1] + 2];
          
          return (
            <React.Fragment key={trip.id}>
              <Marker
                position={origin}
                icon={new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
                  iconSize: [15, 25],
                  iconAnchor: [7, 25],
                })}
              >
                <Popup className="dark-popup">
                  <div className="text-xs font-bold">Origin: {trip.origin_city}</div>
                </Popup>
              </Marker>
              <Polyline
                positions={[origin, destination]}
                pathOptions={{ 
                  color: '#f97316', 
                  weight: 1, 
                  dashArray: '5, 5',
                  opacity: 0.5
                }}
              />
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default TripMap;