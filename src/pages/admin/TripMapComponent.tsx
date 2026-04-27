import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';

// Massive coordinate cache for instant loading of common locations
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
  'hazaribagh': [23.9925, 85.3633],
  'bokaro': [23.6693, 86.1511],
  'gurgaon': [28.4595, 77.0266],
  'gurugram': [28.4595, 77.0266],
  'noida': [28.5355, 77.3910],
  'surat': [21.1702, 72.8311],
  'bhubaneswar': [20.2961, 85.8245],
  'guwahati': [26.1445, 91.7362],
  'amritsar': [31.6340, 74.8723],
  'madurai': [9.9252, 78.1198],
  'vijayawada': [16.5062, 80.6480],
  'gwalior': [26.2124, 78.1772],
  'coimbatore': [11.0168, 76.9558],
  'jodhpur': [26.2389, 73.0243],
  'raipur': [21.2514, 81.6296],
  'kota': [25.2138, 75.8648],
  'chandigarh': [30.7333, 76.7794],
  'hubli': [15.3647, 75.1240],
  'mysore': [12.2958, 76.6394],
  'bareilly': [28.3670, 79.4304],
  'aligarh': [27.8974, 78.0880],
  'tiruchirappalli': [10.7905, 78.7047],
  'solapur': [17.6599, 75.9064],
  'varanasi': [25.3176, 82.9739],
  'dehradun': [30.3165, 78.0322],
  'panaji': [15.4909, 73.8278],
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const applyJitter = (coord: [number, number], index: number): [number, number] => {
  const jitter = 0.02; 
  const angle = (index * 137.5) % 360; 
  const rad = (angle * Math.PI) / 180;
  return [coord[0] + Math.sin(rad) * jitter, coord[1] + Math.cos(rad) * jitter];
};

async function getCityCoords(city: string): Promise<[number, number] | null> {
  const normalized = city.toLowerCase().trim();
  if (coordCache[normalized]) return coordCache[normalized];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', India')}&format=json&limit=1`,
      { headers: { 'User-Agent': 'LoadSaathi-Admin/1.0' } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      coordCache[normalized] = coords;
      return coords;
    }
  } catch (err) {
    console.error(`Geocode error: ${city}`, err);
  }
  return null;
}

const truckIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png', iconSize: [24, 24], iconAnchor: [12, 12] });
const boxIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png', iconSize: [24, 24], iconAnchor: [12, 12] });
const flagIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233005.png', iconSize: [24, 24], iconAnchor: [12, 24] });

interface TripMapProps { trips: any[]; shipments: any[]; }

const TripMap: React.FC<TripMapProps> = ({ trips, shipments }) => {
  const [resolvedTrips, setResolvedTrips] = useState<any[]>([]);
  const [resolvedShipments, setResolvedShipments] = useState<any[]>([]);
  const [resolving, setResolving] = useState(false);
  const dataRef = useRef({ trips, shipments });

  useEffect(() => {
    dataRef.current = { trips, shipments };
    
    let isMounted = true;
    const processSequentially = async () => {
      setResolving(true);
      const { trips: tList, shipments: sList } = dataRef.current;
      
      const tripsResult: any[] = [];
      const shipmentsResult: any[] = [];

      for (let i = 0; i < tList.length; i++) {
        if (!isMounted) break;
        const trip = tList[i];
        if (trip.status === 'cancelled') continue;
        
        const originCity = trip.origin_city.toLowerCase().trim();
        const destCity = trip.destination_city.toLowerCase().trim();
        
        const origin = await getCityCoords(trip.origin_city);
        // Only sleep if we actually hit the API (not in cache)
        if (!coordCache[originCity]) await sleep(500);
        
        const dest = await getCityCoords(trip.destination_city);
        if (!coordCache[destCity]) await sleep(500);

        if (origin && dest) {
          tripsResult.push({ ...trip, origin: applyJitter(origin, i), destination: applyJitter(dest, i + 10) });
          if (isMounted) setResolvedTrips([...tripsResult]);
        }
      }

      for (let i = 0; i < sList.length; i++) {
        if (!isMounted) break;
        const ship = sList[i];
        if (ship.status === 'cancelled') continue;

        const originCity = ship.origin_city.toLowerCase().trim();
        const destCity = ship.destination_city.toLowerCase().trim();

        const origin = await getCityCoords(ship.origin_city);
        if (!coordCache[originCity]) await sleep(500);
        
        const dest = await getCityCoords(ship.destination_city);
        if (!coordCache[destCity]) await sleep(500);

        if (origin && dest) {
          shipmentsResult.push({ ...ship, origin: applyJitter(origin, i + 50), destination: applyJitter(dest, i + 60) });
          if (isMounted) setResolvedShipments([...shipmentsResult]);
        }
      }

      if (isMounted) setResolving(false);
    };

    processSequentially();
    return () => { isMounted = false; };
  }, [trips, shipments]);

  return (
    <div className="h-full w-full bg-slate-900 overflow-hidden relative">
      <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', background: '#020617' }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OSM' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        
        {resolvedTrips.map(t => (
          <React.Fragment key={`t-${t.id}`}>
            <Marker position={t.origin} icon={truckIcon}><Popup>{t.trucker?.full_name}: {t.origin_city}</Popup></Marker>
            <Marker position={t.destination} icon={flagIcon}><Popup>To: {t.destination_city}</Popup></Marker>
            <Polyline positions={[t.origin, t.destination]} pathOptions={{ color: '#f97316', weight: 2, dashArray: '5, 10', opacity: 0.7 }} />
          </React.Fragment>
        ))}

        {resolvedShipments.map(s => (
          <React.Fragment key={`s-${s.id}`}>
            <Marker position={s.origin} icon={boxIcon}><Popup>{s.shipper?.full_name}: {s.origin_city}</Popup></Marker>
            <Marker position={s.destination} icon={flagIcon}><Popup>To: {s.destination_city}</Popup></Marker>
            <Polyline positions={[s.origin, s.destination]} pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '5, 10', opacity: 0.7 }} />
          </React.Fragment>
        ))}
      </MapContainer>

      {resolving && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-slate-950/90 border border-slate-800 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl">
          <Loader2 className="h-4 w-4 text-orange-500 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
            Mapping Global Logistics ({resolvedTrips.length + resolvedShipments.length} found)
          </span>
        </div>
      )}
    </div>
  );
};

export default TripMap;