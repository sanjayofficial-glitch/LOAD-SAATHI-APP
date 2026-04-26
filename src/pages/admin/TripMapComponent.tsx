import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trip, Shipment } from '@/types';

// Significantly expanded coordinate lookup for Indian cities and towns
const CITY_COORDS: Record<string, [number, number]> = {
  'mumbai': [19.0760, 72.8777],
  'navi mumbai': [19.0330, 73.0297],
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'gurugram': [28.4595, 77.0266],
  'noida': [28.5355, 77.3910],
  'ghaziabad': [28.6692, 77.4538],
  'faridabad': [28.4089, 77.3178],
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
  'pimpri-chinchwad': [18.6298, 73.7997],
  'patna': [25.5941, 85.1376],
  'vadodara': [22.3072, 73.1812],
  'ludhiana': [30.9010, 75.8573],
  'agra': [27.1767, 78.0081],
  'nashik': [19.9975, 73.7898],
  'meerut': [28.9845, 77.7064],
  'rajkot': [22.3039, 70.8022],
  'kalyan': [19.2403, 73.1305],
  'varanasi': [25.3176, 82.9739],
  'srinagar': [34.0837, 74.7973],
  'aurangabad': [19.8762, 75.3433],
  'dhanbad': [23.7957, 86.4304],
  'amritsar': [31.6340, 74.8723],
  'allahabad': [25.4358, 81.8463],
  'prayagraj': [25.4358, 81.8463],
  'ranchi': [23.3441, 85.3096],
  'howrah': [22.5958, 88.2636],
  'coimbatore': [11.0168, 76.9558],
  'jabalpur': [23.1815, 79.9864],
  'gwalior': [26.2124, 78.1772],
  'vijayawada': [16.5062, 80.6480],
  'jodhpur': [26.2389, 73.0243],
  'madurai': [9.9252, 78.1198],
  'raipur': [21.2514, 81.6296],
  'kota': [25.2138, 75.8648],
  'guwahati': [26.1445, 91.7362],
  'chandigarh': [30.7333, 76.7794],
  'solapur': [17.6599, 75.9064],
  'hubli': [15.3647, 75.1240],
  'bareilly': [28.3670, 79.4304],
  'mysore': [12.2958, 76.6394],
  'tiruchirappalli': [10.7905, 78.7047],
  'salem': [11.6643, 78.1460],
  'aligarh': [27.8974, 78.0880],
  'tiruppur': [11.1085, 77.3411],
  'moradabad': [28.8351, 78.7749],
  'jalandhar': [31.3260, 75.5762],
  'bhubaneswar': [20.2961, 85.8245],
  'warangal': [17.9689, 79.5941],
  'guntur': [16.3067, 80.4365],
  'jammu': [32.7266, 74.8570],
  'nellore': [14.4426, 79.9865],
  'mangalore': [12.9141, 74.8560],
  'kochi': [9.9312, 76.2673],
  'udaipur': [24.5854, 73.7125],
  'dehradun': [30.3165, 78.0322],
  'surat': [21.1702, 72.8311],
  'vaishali': [25.9928, 85.1272],
  'hajipur': [25.6839, 85.2084],
  'siliguri': [26.7271, 88.3953],
  'jamshedpur': [22.8046, 86.2029],
  'panaji': [15.4909, 73.8278],
  'shillong': [25.5788, 91.8833],
  'itagar': [27.0844, 93.6053],
  'kohima': [25.6751, 94.1086],
  'imphal': [24.8170, 93.9368],
  'aizawl': [23.7271, 92.7176],
  'agartala': [23.8315, 91.2868],
  'gangtok': [27.3314, 88.6138],
  'port blair': [11.6234, 92.7265],
  'kavaratti': [10.5667, 72.6417],
};

// Helper to add a slight random jitter to coordinates to prevent exact overlapping
const applyJitter = (coord: [number, number], index: number): [number, number] => {
  const jitter = 0.02; // Roughly 2km offset
  // Use index to create a deterministic but varied offset
  const angle = (index * 137.5) % 360; // Golden angle for distribution
  const rad = (angle * Math.PI) / 180;
  const offsetLat = Math.sin(rad) * (jitter * (1 + (index % 5) * 0.1));
  const offsetLon = Math.cos(rad) * (jitter * (1 + (index % 5) * 0.1));
  return [coord[0] + offsetLat, coord[1] + offsetLon];
};

const getCoords = (cityName: string): [number, number] | null => {
  if (!cityName) return null;
  const normalized = cityName.toLowerCase().trim();
  return CITY_COORDS[normalized] || null;
};

// Custom icons
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const boxIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
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
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  // Process data with jitter for rendering
  const renderedTrips = useMemo(() => {
    return trips
      .filter(t => t.status !== 'cancelled')
      .map((trip, idx) => {
        const originBase = getCoords(trip.origin_city);
        const destBase = getCoords(trip.destination_city);
        if (!originBase || !destBase) return null;
        
        return {
          ...trip,
          origin: applyJitter(originBase, idx),
          destination: applyJitter(destBase, idx + 100)
        };
      })
      .filter(Boolean);
  }, [trips]);

  const renderedShipments = useMemo(() => {
    return shipments
      .filter(s => s.status !== 'cancelled')
      .map((shipment, idx) => {
        const originBase = getCoords(shipment.origin_city);
        const destBase = getCoords(shipment.destination_city);
        if (!originBase || !destBase) return null;

        return {
          ...shipment,
          origin: applyJitter(originBase, idx + 500),
          destination: applyJitter(destBase, idx + 600)
        };
      })
      .filter(Boolean);
  }, [shipments]);

  return (
    <div className="h-full w-full bg-slate-900 border border-slate-800 overflow-hidden">
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
        {renderedTrips.map((trip: any) => (
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
                weight: 2, 
                dashArray: '8, 12',
                opacity: 0.6
              }}
            />
          </React.Fragment>
        ))}

        {/* Shipper Shipments - Blue lines */}
        {renderedShipments.map((shipment: any) => (
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
                weight: 2, 
                dashArray: '8, 12',
                opacity: 0.6
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};

export default TripMap;