import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip, Shipment } from '@/types';

// Simple coordinate lookup for major Indian cities
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

const createIcon = (color: 'orange' | 'blue' | 'green' | 'red') => {
  const url = color === 'orange' 
    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png'
    : color === 'blue' 
    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
    : color === 'green'
    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
    : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';

  return new L.Icon({
    iconUrl: url,
    iconSize: [18, 30],
    iconAnchor: [9, 30],
    popupAnchor: [1, -26],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [30, 30],
  });
};

interface TripMapProps {
  trips: Trip[];
  shipments: Shipment[];
}

const TripMap: React.FC<TripMapProps> = ({ trips, shipments }) => {
  const activeTrips = trips.filter(trip => trip.status === 'active').slice(0, 15);
  const activeShipments = shipments.filter(s => s.status === 'pending').slice(0, 15);
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
        
        {/* Trucker Trips - Orange */}
        {activeTrips.map(trip => {
          const origin = CITY_COORDS[trip.origin_city];
          const destination = CITY_COORDS[trip.destination_city];
          
          if (!origin || !destination) return null;
          
          return (
            <React.Fragment key={`trip-${trip.id}`}>
              <Marker position={origin} icon={createIcon('orange')}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-orange-600 uppercase">Trucker Trip</p>
                    <p>Origin: {trip.origin_city}</p>
                    <p>Capacity: {trip.available_capacity_tonnes}t</p>
                  </div>
                </Popup>
              </Marker>
              <Marker position={destination} icon={createIcon('orange')}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-orange-600 uppercase">Trucker Destination</p>
                    <p>{trip.destination_city}</p>
                  </div>
                </Popup>
              </Marker>
              <Polyline
                positions={[origin, destination]}
                pathOptions={{ 
                  color: '#f97316', 
                  weight: 2, 
                  dashArray: '10, 10',
                  opacity: 0.6
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Shipper Shipments - Blue */}
        {activeShipments.map(shipment => {
          const origin = CITY_COORDS[shipment.origin_city];
          const destination = CITY_COORDS[shipment.destination_city];
          
          if (!origin || !destination) return null;
          
          return (
            <React.Fragment key={`shipment-${shipment.id}`}>
              <Marker position={origin} icon={createIcon('blue')}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-blue-600 uppercase">Shipper Load</p>
                    <p>Origin: {shipment.origin_city}</p>
                    <p>Weight: {shipment.weight_tonnes}t</p>
                  </div>
                </Popup>
              </Marker>
              <Marker position={destination} icon={createIcon('blue')}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-blue-600 uppercase">Delivery Point</p>
                    <p>{shipment.destination_city}</p>
                  </div>
                </Popup>
              </Marker>
              <Polyline
                positions={[origin, destination]}
                pathOptions={{ 
                  color: '#3b82f6', 
                  weight: 2, 
                  opacity: 0.6
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