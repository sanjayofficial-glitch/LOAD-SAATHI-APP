import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip } from '@/types';

// Fix default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TripMap: React.FC<{ trips: Trip[] }> = ({ trips }) => {
  // Filter active trips
  const activeTrips = trips.filter(trip => trip.status === 'active');

  // Default coordinates for India center
  const defaultCoords: L.LatLngExpression = [20.5937, 78.9629];

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={defaultCoords}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Active trips markers */}
        {activeTrips.map(trip => {
          // Use default coordinates since Trip type doesn't have lat/lon fields
          const origin: L.LatLngExpression = defaultCoords;
          const destination: L.LatLngExpression = defaultCoords;
          
          return (
            <React.Fragment key={trip.id}>
              <Marker
                position={origin}
                icon={new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })}
              >
                <Popup>
                  <strong>Origin</strong>
                  <br />
                  From: {trip.origin_city}
                </Popup>
              </Marker>
              <Marker
                position={destination}
                icon={new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })}
              >
                <Popup>
                  <strong>Destination</strong>
                  <br />
                  To: {trip.destination_city}
                </Popup>
              </Marker>
              <Polyline
                positions={[origin, destination]}
                pathOptions={{ color: '#f97316', weight: 3, dashArray: '8, 8' }}
              />
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default TripMap;