import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TripMapProps {
  trips: any[];
  shipments: any[];
}

const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
  iconSize: [24, 24] as L.PointTuple,
  iconAnchor: [12, 12] as L.PointTuple,
});

const boxIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
  iconSize: [24, 24] as L.PointTuple,
  iconAnchor: [12, 12] as L.PointTuple,
});

const TripMapComponent: React.FC<TripMapProps> = ({ trips, shipments }) => {
  const center: [number, number] = [20.5937, 78.9629]; // Center of India

  return (
    <MapContainer 
      center={center} 
      zoom={5} 
      style={{ height: '100%', width: '100%', background: '#020617' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {trips.map((trip) => (
        trip.origin_lat && trip.origin_lng && (
          <Marker 
            key={`trip-${trip.id}`} 
            position={[trip.origin_lat, trip.origin_lng]} 
            icon={truckIcon}
          >
            <Popup>
              <div className="text-xs font-bold">Trip: {trip.origin_city} to {trip.destination_city}</div>
            </Popup>
          </Marker>
        )
      ))}

      {shipments.map((shipment) => (
        shipment.origin_lat && shipment.origin_lng && (
          <Marker 
            key={`ship-${shipment.id}`} 
            position={[shipment.origin_lat, shipment.origin_lng]} 
            icon={boxIcon}
          >
            <Popup>
              <div className="text-xs font-bold">Load: {shipment.origin_city} to {shipment.destination_city}</div>
            </Popup>
          </Marker>
        )
      ))}
    </MapContainer>
  );
};

export default TripMapComponent;