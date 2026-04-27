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

const TripMapComponent: React.FC<TripMapProps> = ({ trips, shipments }) => {
  const center: [number, number] = [22.5937, 78.9629]; // Centered on India

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
      
      {trips.map((trip) => (
        <React.Fragment key={`trip-group-${trip.id}`}>
          {trip.origin_lat && trip.origin_lng && (
            <Marker position={[trip.origin_lat, trip.origin_lng]} icon={truckIcon}>
              <Popup className="dark-popup">
                <div className="text-[10px] font-mono">
                  <p className="text-orange-500 font-bold">TRUCK: {trip.vehicle_number}</p>
                  <p className="text-slate-300">{trip.origin_city} → {trip.destination_city}</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Route Line */}
          {trip.origin_lat && trip.destination_lat && (
            <Polyline 
              positions={[
                [trip.origin_lat, trip.origin_lng],
                [trip.destination_lat, trip.destination_lng]
              ]}
              pathOptions={{ 
                color: '#ea580c', 
                weight: 1, 
                dashArray: '5, 10',
                opacity: 0.5
              }}
            />
          )}
        </React.Fragment>
      ))}

      {shipments.map((shipment) => (
        <React.Fragment key={`ship-group-${shipment.id}`}>
          {shipment.origin_lat && shipment.origin_lng && (
            <Marker position={[shipment.origin_lat, shipment.origin_lng]} icon={boxIcon}>
              <Popup className="dark-popup">
                <div className="text-[10px] font-mono">
                  <p className="text-blue-500 font-bold">LOAD: {shipment.goods_description}</p>
                  <p className="text-slate-300">{shipment.origin_city} → {shipment.destination_city}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Shipment Route Line */}
          {shipment.origin_lat && shipment.destination_lat && (
            <Polyline 
              positions={[
                [shipment.origin_lat, shipment.origin_lng],
                [shipment.destination_lat, shipment.destination_lng]
              ]}
              pathOptions={{ 
                color: '#3b82f6', 
                weight: 1, 
                dashArray: '3, 6',
                opacity: 0.4
              }}
            />
          )}
        </React.Fragment>
      ))}
    </MapContainer>
  );
};

export default TripMapComponent;