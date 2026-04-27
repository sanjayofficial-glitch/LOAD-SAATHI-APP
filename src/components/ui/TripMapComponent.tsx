import React from 'react';
import { Map, Marker } from 'react-leaflet';

const TripMapComponent = ({ trips, shipments }) => {
  return (
    <Map center={[0, 0]} zoom={2} style="height: 100%; width: 100%;">
      {trips.map(trip => (
        <Marker key={trip.id} position={[trip.origin_lat, trip.destination_lat]}>
          <div className="marker">
            <span>T</span>
          </div>
        </Marker>
      ))}
      {shipments.map(shipment => (
        <Marker key={shipment.id} position={[shipment.origin_lat, shipment.destination_lat]}>
          <div className="marker">
            <span>S</span>
          </div>
        </Marker>
      ))}
    </Map>
  );
};

export default TripMapComponent;