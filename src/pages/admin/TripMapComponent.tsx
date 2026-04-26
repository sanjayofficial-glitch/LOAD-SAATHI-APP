import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip, Shipment } from '@/types';

// Expanded coordinate lookup for Indian cities
const CITY_COORDS: Record<string, [number, number]> = {
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946],
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
  'pimpri-chinchwad': [18.6298, 73.7997],
  'patna': [25.5941, 85.1376],
  'vadodara': [22.3072, 73.1812],
  'ghaziabad': [28.6692, 77.4538],
  'ludhiana': [30.9010, 75.8573],
  'agra': [27.1767, 78.0081],
  'nashik': [19.9975, 73.7898],
  'faridabad': [28.4089, 77.3178],
  'meerut': [28.9845, 77.7064],
  'rajkot': [22.3039, 70.8022],
  'kalyan-dombivli': [19.2403, 73.1305],
  'vasai-virar': [19.3919, 72.8397],
  'varanasi': [25.3176, 82.9739],
  'srinagar': [34.0837, 74.7973],
  'aurangabad': [19.8762, 75.3433],
  'dhanbad': [23.7957, 86.4304],
  'amritsar': [31.6340, 74.8723],
  'navi mumbai': [19.0330, 73.0297],
  'allahabad': [25.4358, 81.8463],
  'ranchi': [23.3441, 85.3096],
  'howrah': [22.5958, 88.2636],
  'coimbatore': [11.0168, 76.9558],
  'jabalpur': [23.1815, 79.9864],
  'gwalior': [26.2124, 78.1772],
  'vijayawada': [16.5062, 80.6480],
  'jodhpur': [26.2389, 73.0243],
  'madurai': [9.9252, 78.1198],
  'raipur': [21.2514, 81.6296],
  'kota': [25.2138, 75.8648],
  'guwahati': [26.1445, 91.7362],
  'chandigarh': [30.7333, 76.7794],
  'solapur': [17.6599, 75.9064],
  'hubli-dharwad': [15.3647, 75.1240],
  'bareilly': [28.3670, 79.4304],
  'hindupur': [13.8289, 77.4908],
  'aalo': [28.1667, 94.8333],
};

// Helper to get coordinates safely
const getCoords = (cityName: string): [number, number] | null => {
  if (!cityName) return null;
  return CITY_COORDS[cityName.toLowerCase().trim()] || null;
};

// Fix default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createIcon = (color: 'orange' | 'blue') => {
  const url = color === 'orange' 
    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png'
    : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';

  return new L.Icon({
    iconUrl: url,
    iconSize: [20, 32],
    iconAnchor: [10, 32],
    popupAnchor: [1, -28],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [32, 32],
  });
};

interface TripMapProps {
  trips: Trip[];
  shipments: Shipment[];
}

const TripMap: React.FC<TripMapProps> = ({ trips, shipments }) => {
  // Include both active and completed for visualization
  const visibleTrips = trips.filter(t => t.status !== 'cancelled').slice(0, 30);
  const visibleShipments = shipments.filter(s => s.status !== 'cancelled').slice(0, 30);
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
        {visibleTrips.map(trip => {
          const origin = getCoords(trip.origin_city);
          const destination = getCoords(trip.destination_city);
          
          if (!origin || !destination) return null;
          
          return (
            <React.Fragment key={`trip-${trip.id}`}>
              <Marker position={origin} icon={createIcon('orange')}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-orange-600 uppercase">Trucker Origin</p>
                    <p>{trip.origin_city}</p>
                    <p className="text-[10px] text-gray-500">Status: {trip.status}</p>
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
                  weight: 3, 
                  dashArray: '8, 12',
                  opacity: trip.status === 'completed' ? 0.3 : 0.8
                }}
              />
            </React.Fragment>
          );
        })}

        {/* Shipper Shipments - Blue */}
        {visibleShipments.map(shipment => {
          const origin = getCoords(shipment.origin_city);
          const destination = getCoords(shipment.destination_city);
          
          if (!origin || !destination) return null;
          
          return (
            <React.Fragment key={`shipment-${shipment.id}`}>
              <Marker position={origin} icon={createIcon('blue')}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-blue-600 uppercase">Shipper Origin</p>
                    <p>{shipment.origin_city}</p>
                    <p className="text-[10px] text-gray-500">Status: {shipment.status}</p>
                  </div>
                </Popup>
              </Marker>
              <Marker position={destination} icon={createIcon('blue')}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-blue-600 uppercase">Shipper Destination</p>
                    <p>{shipment.destination_city}</p>
                  </div>
                </Popup>
              </Marker>
              <Polyline
                positions={[origin, destination]}
                pathOptions={{ 
                  color: '#3b82f6', 
                  weight: 3, 
                  dashArray: '8, 12',
                  opacity: shipment.status === 'completed' ? 0.3 : 0.8
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