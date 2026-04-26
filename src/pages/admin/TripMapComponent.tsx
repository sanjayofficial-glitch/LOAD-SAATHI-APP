import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip, Shipment } from '@/types';

// Expanded coordinate lookup for Indian cities
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
  'Ludhiana': [30.9010, 75.8573],
  'Agra': [27.1767, 78.0081],
  'Nashik': [19.9975, 73.7898],
  'Faridabad': [28.4089, 77.3178],
  'Meerut': [28.9845, 77.7064],
  'Rajkot': [22.3039, 70.8022],
  'Kalyan-Dombivli': [19.2403, 73.1305],
  'Vasai-Virar': [19.3919, 72.8397],
  'Varanasi': [25.3176, 82.9739],
  'Srinagar': [34.0837, 74.7973],
  'Aurangabad': [19.8762, 75.3433],
  'Dhanbad': [23.7957, 86.4304],
  'Amritsar': [31.6340, 74.8723],
  'Navi Mumbai': [19.0330, 73.0297],
  'Allahabad': [25.4358, 81.8463],
  'Ranchi': [23.3441, 85.3096],
  'Howrah': [22.5958, 88.2636],
  'Coimbatore': [11.0168, 76.9558],
  'Jabalpur': [23.1815, 79.9864],
  'Gwalior': [26.2124, 78.1772],
  'Vijayawada': [16.5062, 80.6480],
  'Jodhpur': [26.2389, 73.0243],
  'Madurai': [9.9252, 78.1198],
  'Raipur': [21.2514, 81.6296],
  'Kota': [25.2138, 75.8648],
  'Guwahati': [26.1445, 91.7362],
  'Chandigarh': [30.7333, 76.7794],
  'Solapur': [17.6599, 75.9064],
  'Hubli-Dharwad': [15.3647, 75.1240],
  'Bareilly': [28.3670, 79.4304],
  'Hindupur': [13.8289, 77.4908],
  'Aalo': [28.1667, 94.8333],
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
  const activeTrips = trips.filter(trip => trip.status === 'active').slice(0, 20);
  const activeShipments = shipments.filter(s => s.status === 'pending').slice(0, 20);
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
                    <p className="font-bold text-orange-600 uppercase">Trucker Origin</p>
                    <p>{trip.origin_city}</p>
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
                  opacity: 0.8
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
                    <p className="font-bold text-blue-600 uppercase">Shipper Origin</p>
                    <p>{shipment.origin_city}</p>
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
                  opacity: 0.8
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