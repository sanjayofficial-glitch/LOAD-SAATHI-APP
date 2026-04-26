import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip, Shipment } from '@/types';
import { Loader2 } from 'lucide-react';

// Expanded coordinate cache to ensure common locations work instantly
// This prevents getting blocked by Nominatim rate limits when loading many trips
const coordCache: Record<string, [number, number]> = {
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'hyderabad': [17.3850, 78.4867],
  'ahmedabad': [23.0225, 72.5714],
  'chennai': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567],
  'jaipur': [26.9124, 75.7873],
  'surat': [21.1702, 72.8311],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'nagpur': [21.1458, 79.0882],
  'indore': [22.7196, 75.8577],
  'thane': [19.2183, 72.9781],
  'bhopal': [23.2599, 77.4126],
  'visakhapatnam': [17.6868, 83.2185],
  'patna': [25.5941, 85.1376],
  'vadodara': [22.3072, 73.1812],
  'ghaziabad': [28.6692, 77.4538],
  'ludhiana': [30.9010, 75.8573],
  'agra': [27.1767, 78.0081],
  'nashik': [19.9975, 73.7898],
  'ranchi': [23.3441, 85.3096],
  'jamshedpur': [22.8046, 86.2029],
  'dhanbad': [23.7957, 86.4304],
  'godda': [24.8256, 87.2114],
  'daltonganj': [23.9933, 84.0722],
  'medininagar': [23.9933, 84.0722],
  'hazaribagh': [23.9925, 85.3633],
  'bokaro': [23.6693, 86.1511],
  'giridih': [24.1917, 86.3039],
  'bhubaneswar': [20.2961, 85.8245],
  'tandwa': [23.8500, 85.0300],
  'devsar': [24.2000, 82.3500],
  'margao': [15.2736, 73.9581],
  'panjim': [15.4909, 73.8278],
  'guwahati': [26.1445, 91.7362],
  'siliguri': [26.7271, 88.3953],
  'asansol': [23.6739, 86.9524],
  'durgapur': [23.5204, 87.3119],
  'raipur': [21.2514, 81.6296],
  'vijayawada': [16.5062, 80.6480],
  'guntur': [16.3067, 80.4365],
  'nellore': [14.4426, 79.9865],
  'kochi': [9.9312, 76.2673],
  'thiruvananthapuram': [8.5241, 76.9366],
  'mysuru': [12.2958, 76.6394],
  'coimbatore': [11.0168, 76.9558],
  'madurai': [9.9252, 78.1198],
  'tiruchirappalli': [10.7905, 78.7047],
  'salem': [11.6643, 78.1460],
};

// Helper to add a slight random jitter to coordinates to prevent exact overlapping
const applyJitter = (coord: [number, number], index: number): [number, number] => {
  const jitter = 0.025; // Balanced jitter for visibility
  const angle = (index * 137.5) % 360; 
  const rad = (angle * Math.PI) / 180;
  const offsetLat = Math.sin(rad) * (jitter * (1 + (index % 5) * 0.2));
  const offsetLon = Math.cos(rad) * (jitter * (1 + (index % 5) * 0.2));
  return [coord[0] + offsetLat, coord[1] + offsetLon];
};

async function getCityCoords(city: string): Promise<[number, number] | null> {
  const normalized = city.toLowerCase().trim();
  if (coordCache[normalized]) return coordCache[normalized];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1`,
      { 
        headers: { 
          'Accept-Language': 'en',
          'User-Agent': 'LoadSaathi-Admin-Monitor/1.1'
        } 
      }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      coordCache[normalized] = coords;
      return coords;
    }
  } catch (error) {
    console.error(`Geocoding error for ${city}:`, error);
  }
  return null;
}

// Custom icons
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const boxIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11],
});

const flagIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233005.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

interface ExtendedTrip extends Omit<Trip, 'trucker'> {
  trucker?: { full_name: string };
}

interface ExtendedShipment extends Omit<Shipment, 'shipper'> {
  shipper?: { full_name: string };
}

interface TripMapProps {
  trips: ExtendedTrip[];
  shipments: ExtendedShipment[];
}

const TripMap: React.FC<TripMapProps> = ({ trips, shipments }) => {
  const [resolvedTrips, setResolvedTrips] = useState<any[]>([]);
  const [resolvedShipments, setResolvedShipments] = useState<any[]>([]);
  const [resolving, setResolving] = useState(false);
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  useEffect(() => {
    let active = true;
    const resolveData = async () => {
      setResolving(true);
      
      const tripResults = [];
      const shipmentResults = [];

      // Process trips sequentially to avoid hitting rate limits too fast
      for (let i = 0; i < trips.length; i++) {
        const trip = trips[i];
        if (trip.status === 'cancelled') continue;
        
        const origin = await getCityCoords(trip.origin_city);
        const dest = await getCityCoords(trip.destination_city);
        
        if (origin && dest) {
          tripResults.push({
            ...trip,
            origin: applyJitter(origin, i),
            destination: applyJitter(dest, i + 10)
          });
        }
      }

      // Process shipments
      for (let i = 0; i < shipments.length; i++) {
        const ship = shipments[i];
        if (ship.status === 'cancelled') continue;
        
        const origin = await getCityCoords(ship.origin_city);
        const dest = await getCityCoords(ship.destination_city);
        
        if (origin && dest) {
          shipmentResults.push({
            ...ship,
            origin: applyJitter(origin, i + 50),
            destination: applyJitter(dest, i + 60)
          });
        }
      }

      if (active) {
        setResolvedTrips(tripResults);
        setResolvedShipments(shipmentResults);
        setResolving(false);
      }
    };

    resolveData();
    return () => { active = false; };
  }, [trips, shipments]);

  return (
    <div className="h-full w-full bg-slate-900 border border-slate-800 overflow-hidden relative">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ height: '100%', width: '100%', background: '#020617' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Trucker Trips - Orange lines */}
        {resolvedTrips.map((trip) => (
          <React.Fragment key={`trip-${trip.id}`}>
            <Marker position={trip.origin} icon={truckIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">Trucker Origin</p>
                  <p className="text-sm font-bold text-slate-800">{trip.trucker?.full_name || 'Anonymous Trucker'}</p>
                  <p className="text-[10px] text-slate-500">{trip.origin_city}</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={trip.destination} icon={flagIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-orange-500 tracking-widest mb-1">Destination</p>
                  <p className="text-sm font-bold text-slate-800">{trip.destination_city}</p>
                </div>
              </Popup>
            </Marker>
            <Polyline
              positions={[trip.origin, trip.destination]}
              pathOptions={{ 
                color: '#f97316', 
                weight: 2.5, 
                dashArray: '6, 10',
                opacity: 0.7
              }}
            />
          </React.Fragment>
        ))}

        {/* Shipper Shipments - Blue lines */}
        {resolvedShipments.map((shipment) => (
          <React.Fragment key={`shipment-${shipment.id}`}>
            <Marker position={shipment.origin} icon={boxIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Shipper Origin</p>
                  <p className="text-sm font-bold text-slate-800">{shipment.shipper?.full_name || 'Anonymous Shipper'}</p>
                  <p className="text-[10px] text-slate-500">{shipment.origin_city}</p>
                </div>
              </Popup>
            </Marker>
            <Marker position={shipment.destination} icon={flagIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Destination</p>
                  <p className="text-sm font-bold text-slate-800">{shipment.destination_city}</p>
                </div>
              </Popup>
            </Marker>
            <Polyline
              positions={[shipment.origin, shipment.destination]}
              pathOptions={{ 
                color: '#3b82f6', 
                weight: 2.5, 
                dashArray: '6, 10',
                opacity: 0.7
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>

      {resolving && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2">
          <Loader2 className="h-3 w-3 text-orange-500 animate-spin" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Updating Logistics Map</span>
        </div>
      )}
    </div>
  );
};

export default TripMap;