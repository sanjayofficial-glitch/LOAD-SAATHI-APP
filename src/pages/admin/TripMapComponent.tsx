import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TripMapProps {
  trips: any[];
  shipments: any[];
}

// Stylized high-tech icons matching the screenshot
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

// Expanded geocoding cache for India
const geoCache: Record<string, [number, number]> = {
  "Mumbai": [19.0760, 72.8777], "Delhi": [28.6139, 77.2090], "Bangalore": [12.9716, 77.5946],
  "Hyderabad": [17.3850, 78.4867], "Ahmedabad": [23.0225, 72.5714], "Chennai": [13.0827, 80.2707],
  "Kolkata": [22.5726, 88.3639], "Surat": [21.1702, 72.8311], "Pune": [18.5204, 73.8567],
  "Jaipur": [26.9124, 75.7873], "Lucknow": [26.8467, 80.9462], "Kanpur": [26.4499, 80.3319],
  "Nagpur": [21.1458, 79.0882], "Indore": [22.7196, 75.8577], "Thane": [19.2183, 72.9781],
  "Bhopal": [23.2599, 77.4126], "Visakhapatnam": [17.6868, 83.2185], "Patna": [25.5941, 85.1376],
  "Vadodara": [22.3072, 73.1812], "Ghaziabad": [28.6692, 77.4538], "Ludhiana": [30.9010, 75.8573],
  "Agra": [27.1767, 78.0081], "Nashik": [19.9975, 73.7898], "Faridabad": [28.4089, 77.3178],
  "Meerut": [28.9845, 77.7064], "Rajkot": [22.3039, 70.8022], "Varanasi": [25.3176, 82.9739],
  "Srinagar": [34.0837, 74.7973], "Aurangabad": [19.8762, 75.3433], "Dhanbad": [23.7957, 86.4304],
  "Amritsar": [31.6340, 74.8723], "Navi Mumbai": [19.0330, 73.0297], "Ranchi": [23.3441, 85.3096],
  "Howrah": [22.5958, 88.2636], "Coimbatore": [11.0168, 76.9558], "Jabalpur": [23.1815, 79.9864],
  "Gwalior": [26.2124, 78.1772], "Vijayawada": [16.5062, 80.6480], "Jodhpur": [26.2389, 73.0243],
  "Madurai": [9.9252, 78.1198], "Raipur": [21.2514, 81.6296], "Kota": [25.2138, 75.8648],
  "Guwahati": [26.1445, 91.7362], "Chandigarh": [30.7333, 76.7794], "Solapur": [17.6599, 75.9064],
  "Mysore": [12.2958, 76.6394], "Gurgaon": [28.4595, 77.0266], "Aligarh": [27.8974, 78.0880],
  "Jalandhar": [31.3260, 75.5762], "Bhubaneswar": [20.2961, 85.8245], "Salem": [11.6643, 78.1460],
  "Warangal": [17.9689, 79.5941], "Guntur": [16.3067, 80.4365], "Gorakhpur": [26.7606, 83.3731],
  "Bikaner": [28.0229, 73.3119], "Noida": [28.5355, 77.3910], "Jamshedpur": [22.8046, 86.2029],
  "Bhilai": [21.1938, 81.3509], "Cuttack": [20.4625, 85.8830], "Kochi": [9.9312, 76.2673],
  "Nellore": [14.4426, 79.9865], "Dehradun": [30.3165, 78.0322], "Jammu": [32.7266, 74.8570],
  "Mangalore": [12.9141, 74.8560], "Udaipur": [24.5854, 73.7125], "Ajmer": [26.4499, 74.6399],
  "Siliguri": [26.7271, 88.3953], "Gaya": [24.7914, 85.0002], "Mathura": [27.4924, 77.6737],
  "Panipat": [29.3909, 76.9635], "Rohtak": [28.8955, 76.6066], "Karnal": [29.6857, 76.9907],
  "Hisar": [29.1492, 75.7217], "Ambala": [30.3782, 76.7767], "Shimla": [31.1048, 77.1734],
  "Haridwar": [29.9457, 78.1642], "Rishikesh": [30.0869, 78.2676], "Haldwani": [29.2183, 79.5130],
  "Almora": [29.5892, 79.6467], "Nainital": [29.3919, 79.4542], "Pithoragarh": [29.5829, 80.2182],
  "Rudrapur": [28.9861, 79.3919], "Kashipur": [29.2104, 78.9619], "Roorkee": [29.8543, 77.8880],
  "Garhwa": [24.1745, 83.8112], "Sambalpur": [21.4669, 83.9812], "Durg": [21.1905, 81.2849]
};

const TripMapComponent: React.FC<TripMapProps> = ({ trips, shipments }) => {
  const center: [number, number] = [22.5937, 78.9629];

  const getCoords = (city: string, index: number): [number, number] | null => {
    if (!city) return null;
    const cleanCity = city.split(',')[0].trim();
    const baseCoords = geoCache[cleanCity];
    
    if (!baseCoords) return null;

    // Robust jitter to ensure every single icon is visible even in the same city
    const jitterLat = (Math.sin(index * 12.9898) * 0.05);
    const jitterLng = (Math.cos(index * 78.233) * 0.05);
    
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
      
      {trips.map((trip, idx) => {
        const origin = getCoords(trip.origin_city, idx);
        const dest = getCoords(trip.destination_city, idx + 100);
        
        return (
          <React.Fragment key={`trip-group-${trip.id}`}>
            {origin && (
              <Marker position={origin} icon={truckIcon}>
                <Popup className="dark-popup">
                  <div className="text-[10px] font-mono bg-slate-950 text-slate-300 p-1">
                    <p className="text-cyan-400 font-bold">TRUCK_NODE: {trip.vehicle_number}</p>
                    <p>{trip.origin_city} → {trip.destination_city}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {origin && dest && (
              <Polyline 
                positions={[origin, dest]}
                pathOptions={{ 
                  color: '#06b6d4', 
                  weight: 1.5, 
                  dashArray: '4, 8',
                  opacity: 0.7
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {shipments.map((shipment, idx) => {
        const origin = getCoords(shipment.origin_city, idx + 500);
        const dest = getCoords(shipment.destination_city, idx + 600);

        return (
          <React.Fragment key={`ship-group-${shipment.id}`}>
            {origin && (
              <Marker position={origin} icon={boxIcon}>
                <Popup className="dark-popup">
                  <div className="text-[10px] font-mono bg-slate-950 text-slate-300 p-1">
                    <p className="text-orange-500 font-bold">LOAD_NODE: {shipment.goods_description}</p>
                    <p>{shipment.origin_city} → {shipment.destination_city}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {origin && dest && (
              <Polyline 
                positions={[origin, dest]}
                pathOptions={{ 
                  color: '#f97316', 
                  weight: 1.5, 
                  dashArray: '2, 4',
                  opacity: 0.6
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};

export default TripMapComponent;