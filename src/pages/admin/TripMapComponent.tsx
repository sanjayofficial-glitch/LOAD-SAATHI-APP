import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

declare module 'react-leaflet' {
  import 'leaflet';
  export interface MapContainerProps {
    whenReady?: () => void;
  }
}

// Fix default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TripMap: React.FC<{ trips: Trip[] }> = ({ trips }) => {
  const [loading, setLoading] = useState(true);
  const mapRef = React.useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    
    const map = mapRef.current;
    if (!map) return;
    
    setLoading(false);
  }, [map]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Filter active trips
  const activeTrips = trips.filter(trip => trip.status === 'active');

  return (
    <div className="h-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        ref={mapRef}
        center={[20.59, 78.96]} // India center coordinates
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Active trips markers */}
        {activeTrips.map(trip => {
          const center = [parseFloat(trip.origin_lat), parseFloat(trip.origin_lon)];
          return (
            <Marker
              key={trip.id}
              position={center}
              icon={new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
              })}
            >
              <Popup>
                <strong>Active Trip</strong>
                <br />
                From: {trip.origin_city}
                <br />
                To: {trip.destination_city}
                <br />
                Capacity: {trip.available_capacity_tonnes} tonnes
              </Popup>
            </Marker>
          );
        })}
        
        {/* Completed trips (last 24h) */}
        {trips
          .filter(trip => trip.status === 'completed')
          .slice(0, 5)
          .map(trip => {
            const center = [parseFloat(trip.origin_lat), parseFloat(trip.origin_lon)];
            return (
              <Marker
                key={trip.id}
                position={center}
                icon={new L.Icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })}
              >
                <Popup>
                  <strong>Completed Trip</strong>
                  <br />
                  {trip.origin_city} → {trip.destination_city}
                </Popup>
              </Marker>
            );
          })}
        
        {/* Route lines for active trips */}
        {activeTrips.map(trip => {
          const origin = [parseFloat(trip.origin_lat), parseFloat(trip.origin_lon)];
          const destination = [parseFloat(trip.destination_lat), parseFloat(trip.destination_lon)];
          
          if (origin && destination) {
            return (
              <Polyline
                key={trip.id}
                positions={[origin, destination]}
                pathOptions={{ color: '#f97316', weight: 3, dashArray: '8, 8' }}
              />
            );
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
};

export default TripMap;