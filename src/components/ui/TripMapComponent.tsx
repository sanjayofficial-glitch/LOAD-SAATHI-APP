import React from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, Flag } from 'lucide-react';

interface Trip {
  id: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  trucker?: {
    full_name: string;
  };
}

interface Shipment {
  id: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  shipper?: {
    full_name: string;
  };
}

const TripMapComponent: React.FC<{ trips: Trip[]; shipments: Shipment[] }> = ({ trips, shipments }) => {
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  return (
    <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      />
      {trips.map((trip) => (
        <Marker key={`t-${trip.id}`} position={[trip.origin_lat, trip.origin_lng]} icon={new (class extends L.Icon {
          options = { iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png', iconSize: [24, 24], iconAnchor: [12, 12] };
        })()}>
          <Popup>{trip.trucker?.full_name || 'Truck'}</Popup>
        </Marker>
      ))}
      {shipments.map((shipment) => (
        <Marker key={`s-${shipment.id}`} position={[shipment.origin_lat, shipment.origin_lng]} icon={new (class extends L.Icon {
          options = { iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png', iconSize: [24, 24], iconAnchor: [12, 12] };
        })()}>
          <Popup>{shipment.shipper?.full_name || 'Shipment'}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default TripMapComponent;