/**
 * RouteMap — Free map using react-leaflet + OpenStreetMap (no API key needed!)
 * Geocodes city names using Nominatim (free, no signup) and draws a route line.
 *
 * Usage:
 *   <RouteMap originCity="Mumbai" destinationCity="Delhi" />
 */
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Skeleton } from '@/components/ui/skeleton';

// Fix Leaflet's default marker icon (broken in Vite builds)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

interface Coords { lat: number; lon: number; }

// Free Nominatim geocoding — no API key needed
async function geocodeCity(city: string, country = 'India'): Promise<Coords | null> {
  try {
    const query = encodeURIComponent(`${city}, ${country}`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    return null;
  } catch {
    return null;
  }
}

interface RouteMapProps {
  originCity: string;
  destinationCity: string;
  height?: string;
}

const RouteMap = ({ originCity, destinationCity, height = '300px' }: RouteMapProps) => {
  const [origin, setOrigin] = useState<Coords | null>(null);
  const [destination, setDestination] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    Promise.all([geocodeCity(originCity), geocodeCity(destinationCity)]).then(([orig, dest]) => {
      if (cancelled) return;
      if (!orig || !dest) { setError(true); }
      else { setOrigin(orig); setDestination(dest); }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [originCity, destinationCity]);

  if (loading) return <Skeleton className="w-full rounded-lg" style={{ height }} />;
  if (error || !origin || !destination) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 text-sm" style={{ height }}>
        Map unavailable for these cities
      </div>
    );
  }

  const center: [number, number] = [
    (origin.lat + destination.lat) / 2,
    (origin.lon + destination.lon) / 2,
  ];

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[origin.lat, origin.lon]} icon={originIcon}>
          <Popup>🟢 From: {originCity}</Popup>
        </Marker>
        <Marker position={[destination.lat, destination.lon]} icon={destIcon}>
          <Popup>🔴 To: {destinationCity}</Popup>
        </Marker>
        <Polyline
          positions={[
            [origin.lat, origin.lon],
            [destination.lat, destination.lon],
          ]}
          pathOptions={{ color: '#f97316', weight: 3, dashArray: '8, 8' }}
        />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
