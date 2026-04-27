import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TripMapProps {
  trips: any[];
  shipments: any[];
}

// Stylized high-tech icons
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  className: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] brightness-125'
});

const boxIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] brightness-125'
});

// Pre-defined coordinates for major hubs
const geoCache: Record<string, [number, number]> = {
  "mumbai": [19.0760, 72.8777], "delhi": [28.6139, 77.2090], "bangalore": [12.9716, 77.5946],
  "hyderabad": [17.3850, 78.4867], "ahmedabad": [23.0225, 72.5714], "chennai": [13.0827, 80.2707],
  "kolkata": [22.5726, 88.3639], "surat": [21.1702, 72.8311], "pune": [18.5204, 73.8567],
  "jaipur": [26.9124, 75.7873], "lucknow": [26.8467, 80.9462], "kanpur": [26.4499, 80.3319],
  "nagpur": [21.1458, 79.0882], "indore": [22.7196, 75.8577], "thane": [19.2183, 72.9781],
  "bhopal": [23.2599, 77.4126], "visakhapatnam": [17.6868, 83.2185], "patna": [25.5941, 85.1376],
  "vadodara": [22.3072, 73.1812], "ghaziabad": [28.6692, 77.4538], "ludhiana": [30.9010, 75.8573],
  "agra": [27.1767, 78.0081], "nashik": [19.9975, 73.7898], "faridabad": [28.4089, 77.3178],
  "meerut": [28.9845, 77.7064], "rajkot": [22.3039, 70.8022], "varanasi": [25.3176, 82.9739]
};

const TripMapComponent: React.FC<TripMapProps> = ({ trips, shipments }) => {
  const center: [number, number] = [22.5937, 78.9629];

  // Deterministic hash function to place unknown cities at a consistent spot in India
  const getFallbackCoords = (name: string): [number, number] => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
    }
    const absHash = Math.abs(hash);
    // Map hash to India's bounding box: Lat [12, 28], Lng [72, 88]
    const lat = 12 + (absHash % 1600) / 100;
    const lng = 72 + ((absHash >> 4) % 1600) / 100;
    return [lat, lng];
  };

  const getCoords = (city: string, index: number): [number, number] => {
    if (!city) return getFallbackCoords(`unknown-${index}`);
    
    const cleanCity = city.split(',')[0].trim().toLowerCase();
    const baseCoords = geoCache[cleanCity] || getFallbackCoords(cleanCity);

    // Robust jitter to ensure every single icon is visible even in the same city
    // We use the index to ensure they spread out in a circle
    const angle = (index * 137.5) * (Math.PI / 180); // Golden angle
    const radius = 0.08; // Spread radius
    const jitterLat = Math.sin(angle) * radius;
    const jitterLng = Math.cos(angle) * radius;
    
    return [baseCoords[0] + jitterLat, baseCoords[1] + jitterLng];
  };

  return (
    <MapContainer 
      center={center} 
      zoom={5} 
      style={{ height: '100%', width: '100%', background: '#020617' }}
      zoomControl={false}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; CartoDB'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      {/* Render every single trip */}
      {trips.map((trip, idx) => {
        const origin = getCoords(trip.origin_city, idx);
        const dest = getCoords(trip.destination_city, idx + 500);
        
        return (
          <React.Fragment key={`trip-group-${trip.id}`}>
            <Marker position={origin} icon={truckIcon}>
              <Popup className="dark-popup">
                <div className="text-[10px] font-mono bg-slate-950 text-slate-300 p-1">
                  <p className="text-cyan-400 font-bold">TRUCK_NODE: {trip.vehicle_number}</p>
                  <p>{trip.origin_city} → {trip.destination_city}</p>
                </div>
              </Popup>
            </Marker>
            
            <Polyline 
              positions={[origin, dest]}
              pathOptions={{ 
                color: '#06b6d4', 
                weight: 1.5, 
                dashArray: '4, 8',
                opacity: 0.7
              }}
            />
          </React.Fragment>
        );
      })}

      {/* Render every single shipment */}
      {shipments.map((shipment, idx) => {
        const origin = getCoords(shipment.origin_city, idx + 1000);
        const dest = getCoords(shipment.destination_city, idx + 1500);

        return (
          <React.Fragment key={`ship-group-${shipment.id}`}>
            <Marker position={origin} icon={boxIcon}>
              <Popup className="dark-popup">
                <div className="text-[10px] font-mono bg-slate-950 text-slate-300 p-1">
                  <p className="text-orange-500 font-bold">LOAD_NODE: {shipment.goods_description}</p>
                  <p>{shipment.origin_city} → {shipment.destination_city}</p>
                </div>
              </Popup>
            </Marker>

            <Polyline 
              positions={[origin, dest]}
              pathOptions={{ 
                color: '#f97316', 
                weight: 1.5, 
                dashArray: '2, 4',
                opacity: 0.6
              }}
            />
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};

export default TripMapComponent;