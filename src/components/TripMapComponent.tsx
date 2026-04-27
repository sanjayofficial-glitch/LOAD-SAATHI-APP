import React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface TripMapProps {
  trips: any[];
  height?: string;
}

const TripMapComponent = ({ trips, height = '300px' }: TripMapProps) => {
  const [markers, setMarkers] = React.useState<L.LayerGroup | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);

  React.useEffect(() => {
    if (!trips || trips.length === 0) return;

    // Create a layer group to hold all markers and polylines
    const layerGroup = L.layerGroup();

    // Collect all coordinates to fit bounds
    const allCoords: L.LatLng[] = [];

    trips.forEach((trip) => {
      const originCoordsPromise = geocodeCity(trip.origin_city);
      const destCoordsPromise = geocodeCity(trip.destination_city);

      Promise.all([originCoordsPromise, destCoordsPromise]).then(([origin, dest]) => {
        if (!origin || !dest) return;

        // Add origin marker
        const originMarker = L.marker([origin.lat, origin.lon], { icon: originIcon })
          .bindPopup(`<b>From:</b> ${trip.origin_city}`);
        originMarker.addTo(layerGroup);
        allCoords.push(L.latLng(origin.lat, origin.lon));

        // Add destination marker
        const destMarker = L.marker([dest.lat, dest.lon], { icon: destIcon })
          .bindPopup(`<b>To:</b> ${trip.destination_city}`);
        destMarker.addTo(layerGroup);
        allCoords.push(L.latLng(dest.lat, dest.lon));

        // Add polyline
        const latLngs = [
          [origin.lat, origin.lon],
          [dest.lat, dest.lon],
        ];
        const polyline = L.polyline(latLngs as L.LatLngExpression[], {
          color: '#f97316',
          weight: 3,
          dashArray: '8, 8',
        });
        polyline.addTo(layerGroup);

        // Update the map bounds to fit all markers
        if (mapRef.current && allCoords.length > 0) {
          const bounds = L.latLngBounds(allCoords);
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      });
    });

    setMarkers(layerGroup);
  }, [trips]);

  // Center fallback
  const center: [number, number] = [22.5937, 78.9629];

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers && <MarkerGroup group={markers} />}
      </MapContainer>
    </div>
  );
};

// Helper component to add layer group to map
const MarkerGroup = ({ group }: { group: L.LayerGroup }) => {
  React.useEffect(() => {
    // This effect is just to trigger re-render when group changes
  }, [group]);
  return null;
};

export default TripMapComponent;