import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TripMapProps {
  trips: any[];
  shipments: any[];
}

// Custom high-tech icons
const truckIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: 'drop-shadow-[0_0_5px_rgba(234,88,12,0.8)]'
});

const boxIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: 'drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]'
});

// Simple geocoding cache to avoid hitting rate limits
const geoCache: Record<string, [number, number]> = {
  "Mumbai": [19.0760, 72.8777],
  "Delhi": [28.6139, 77.2090],
  "Bangalore": [12.9716, 77.5946],
  "Hyderabad": [17.3850, 78.4867],
  "Ahmedabad": [23.0225, 72.5714],
  "Chennai": [13.0827, 80.2707],
  "Kolkata": [22.5726, 88.3639],
  "Surat": [21.1702, 72.8311],
  "Pune": [18.5204, 73.8567],
  "Jaipur": [26.9124, 75.7873],
  "Lucknow": [26.8467, 80.9462],
  "Kanpur": [26.4499, 80.3319],
  "Nagpur": [21.1458, 79.0882],
  "Indore": [22.7196, 75.8577],
  "Thane": [19.2183, 72.9781],
  "Bhopal": [23.2599, 77.4126],
  "Visakhapatnam": [17.6868, 83.2185],
  "Pimpri-Chinchwad": [18.6298, 73.7997],
  "Patna": [25.5941, 85.1376],
  "Vadodara": [22.3072, 73.1812],
  "Ghaziabad": [28.6692, 77.4538],
  "Ludhiana": [30.9010, 75.8573],
  "Agra": [27.1767, 78.0081],
  "Nashik": [19.9975, 73.7898],
  "Faridabad": [28.4089, 77.3178],
  "Meerut": [28.9845, 77.7064],
  "Rajkot": [22.3039, 70.8022],
  "Kalyan-Dombivli": [19.2403, 73.1305],
  "Vasai-Virar": [19.3919, 72.8397],
  "Varanasi": [25.3176, 82.9739],
  "Srinagar": [34.0837, 74.7973],
  "Aurangabad": [19.8762, 75.3433],
  "Dhanbad": [23.7957, 86.4304],
  "Amritsar": [31.6340, 74.8723],
  "Navi Mumbai": [19.0330, 73.0297],
  "Allahabad": [25.4358, 81.8463],
  "Ranchi": [23.3441, 85.3096],
  "Howrah": [22.5958, 88.2636],
  "Coimbatore": [11.0168, 76.9558],
  "Jabalpur": [23.1815, 79.9864],
  "Gwalior": [26.2124, 78.1772],
  "Vijayawada": [16.5062, 80.6480],
  "Jodhpur": [26.2389, 73.0243],
  "Madurai": [9.9252, 78.1198],
  "Raipur": [21.2514, 81.6296],
  "Kota": [25.2138, 75.8648],
  "Guwahati": [26.1445, 91.7362],
  "Chandigarh": [30.7333, 76.7794],
  "Solapur": [17.6599, 75.9064],
  "Hubli-Dharwad": [15.3647, 75.1240],
  "Bareilly": [28.3670, 79.4304],
  "Moradabad": [28.8359, 78.7732],
  "Mysore": [12.2958, 76.6394],
  "Gurgaon": [28.4595, 77.0266],
  "Aligarh": [27.8974, 78.0880],
  "Jalandhar": [31.3260, 75.5762],
  "Tiruchirappalli": [10.7905, 78.7047],
  "Bhubaneswar": [20.2961, 85.8245],
  "Salem": [11.6643, 78.1460],
  "Mira-Bhayandar": [19.2813, 72.8557],
  "Warangal": [17.9689, 79.5941],
  "Guntur": [16.3067, 80.4365],
  "Bhiwandi": [19.2813, 73.0483],
  "Saharanpur": [29.9640, 77.5460],
  "Gorakhpur": [26.7606, 83.3731],
  "Bikaner": [28.0229, 73.3119],
  "Amravati": [20.9320, 77.7523],
  "Noida": [28.5355, 77.3910],
  "Jamshedpur": [22.8046, 86.2029],
  "Bhilai": [21.1938, 81.3509],
  "Cuttack": [20.4625, 85.8830],
  "Firozabad": [27.1508, 78.4011],
  "Kochi": [9.9312, 76.2673],
  "Nellore": [14.4426, 79.9865],
  "Bhavnagar": [21.7645, 72.1519],
  "Dehradun": [30.3165, 78.0322],
  "Durgapur": [23.4807, 87.3119],
  "Asansol": [23.6739, 86.9524],
  "Rourkela": [22.2604, 84.8536],
  "Nanded": [19.1383, 77.3210],
  "Kolhapur": [16.7050, 74.2433],
  "Ajmer": [26.4499, 74.6399],
  "Akola": [20.7002, 77.0082],
  "Gulbarga": [17.3297, 76.8343],
  "Jamnagar": [22.4707, 70.0577],
  "Ujjain": [23.1760, 75.7885],
  "Loni": [28.7500, 77.2833],
  "Jhansi": [25.4484, 78.5685],
  "Puducherry": [11.9416, 79.8083],
  "Jammu": [32.7266, 74.8570],
  "Belgaum": [15.8497, 74.4977],
  "Mangalore": [12.9141, 74.8560],
  "Tirunelveli": [8.7139, 77.7567],
  "Malegaon": [20.5517, 74.5089],
  "Gaya": [24.7914, 85.0002],
  "Jalgaon": [21.0077, 75.5626],
  "Udaipur": [24.5854, 73.7125],
  "Maheshtala": [22.5000, 88.2500]
};

const TripMapComponent: React.FC<TripMapProps> = ({ trips, shipments }) => {
  const center: [number, number] = [22.5937, 78.9629]; // Centered on India

  const getCoords = (city: string): [number, number] | null => {
    // Clean city name
    const cleanCity = city.split(',')[0].trim();
    return geoCache[cleanCity] || null;
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
      
      {trips.map((trip) => {
        const origin = getCoords(trip.origin_city);
        const dest = getCoords(trip.destination_city);
        
        return (
          <React.Fragment key={`trip-group-${trip.id}`}>
            {origin && (
              <Marker position={origin} icon={truckIcon}>
                <Popup className="dark-popup">
                  <div className="text-[10px] font-mono">
                    <p className="text-orange-500 font-bold">TRUCK: {trip.vehicle_number}</p>
                    <p className="text-slate-300">{trip.origin_city} → {trip.destination_city}</p>
                    <p className="text-slate-500">Rate: ₹{trip.price_per_tonne}/t</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {origin && dest && (
              <Polyline 
                positions={[origin, dest]}
                pathOptions={{ 
                  color: '#ea580c', 
                  weight: 1, 
                  dashArray: '5, 10',
                  opacity: 0.6
                }}
              />
            )}
          </React.Fragment>
        );
      })}

      {shipments.map((shipment) => {
        const origin = getCoords(shipment.origin_city);
        const dest = getCoords(shipment.destination_city);

        return (
          <React.Fragment key={`ship-group-${shipment.id}`}>
            {origin && (
              <Marker position={origin} icon={boxIcon}>
                <Popup className="dark-popup">
                  <div className="text-[10px] font-mono">
                    <p className="text-blue-500 font-bold">LOAD: {shipment.goods_description}</p>
                    <p className="text-slate-300">{shipment.origin_city} → {shipment.destination_city}</p>
                    <p className="text-slate-500">Weight: {shipment.weight_tonnes}t</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {origin && dest && (
              <Polyline 
                positions={[origin, dest]}
                pathOptions={{ 
                  color: '#3b82f6', 
                  weight: 1, 
                  dashArray: '3, 6',
                  opacity: 0.5
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