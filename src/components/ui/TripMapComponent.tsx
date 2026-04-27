import React from 'react';
import { MapContainer, Marker, TileLayer, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Trip {
  id: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  origin_city: string;
  destination_city: string;
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
  origin_city: string;
  destination_city: string;
  shipper?: {
    full_name: string;
  };
}

const TripMapComponent: React.FC<{ trips: Trip[]; shipments: Shipment[] }> = ({ trips, shipments }) => {
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
    iconSize: [24, 24] as L.PointExpression,
    iconAnchor: [12, 12] as L.PointExpression,
  });

  const boxIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
    iconSize: [24, 24] as L.PointExpression,
    iconAnchor: [12, 12] as L.PointExpression,
  });

  const flagIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233005.png',
    iconSize: [24, 24] as L.PointExpression,
    iconAnchor: [12, 24] as L.PointExpression,
  });

  return (
    <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      />
      {trips.map((trip) => (
        <Marker key={`t-${trip.id}`} position={[trip.origin_lat, trip.origin_lng]} icon={truckIcon}>
          <Popup>{trip.trucker?.full_name || 'Truck'}</Popup>
        </Marker>
      ))}
      {trips.map((trip) => (
        <Marker key={`t-dest-${trip.id}`} position={[trip.destination_lat, trip.destination_lng]} icon={flagIcon}>
          <Popup>To: {trip.destination_city}</Popup>
        </Marker>
      ))}
      {shipments.map((shipment) => (
        <Marker key={`s-${shipment.id}`} position={[shipment.origin_lat, shipment.origin_lng]} icon={boxIcon}>
          <Popup>{shipment.shipper?.full_name || 'Shipment'}</Popup>
        </Marker>
      ))}
      {shipments.map((shipment) => (
        <Marker key={`s-dest-${shipment.id}`} position={[shipment.destination_lat, shipment.destination_lng]} icon={flagIcon}>
          <Popup>To: {shipment.destination_city}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default TripMapComponent;