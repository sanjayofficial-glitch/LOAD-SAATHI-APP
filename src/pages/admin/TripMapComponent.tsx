import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ResizableHandle } from '@/components/ui/resizable';

const MAP_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

const ResizeHandler = () => null;

export default function TripMapComponent({ items, type, color }: { items: any[]; type: string; color: string }) {
  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%', background: '#0f172a' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ResizeHandler />
    </MapContainer>
  );
}