export interface User {
  id: string;
  email: string;
  user_type: 'trucker' | 'shipper' | 'admin';  // Added 'admin' type
  full_name: string;
  phone: string;  company_name?: string;
  is_verified: boolean;
  rating: number;
  total_trips: number;
  created_at: string;
}

export interface Trip {
  id: string;  trucker_id: string;
  origin_city: string;
  destination_city: string;
  departure_date: string;
  available_capacity_tonnes: number;
  price_per_tonne: number;
  vehicle_type: string;
  vehicle_number: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  trucker?: User;
  requests?: Request[];
}

export interface Shipment {
  id: string;
  shipper_id: string;
  origin_city: string;
  destination_city: string;
  departure_date: string;
  goods_description: string;
  weight_tonnes: number;
  pickup_address: string;
  delivery_address: string;
  budget_per_tonne: number;  status: 'pending' | 'matched' | 'completed' | 'cancelled';
  created_at: string;
  shipper?: User;
}
export interface Request {
  id: string;
  trip_id: string;
  shipper_id: string;
  goods_description: string;  weight_tonnes: number;  pickup_address: string;
  delivery_address: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  trip?: Trip;
  shipper?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  related_trip_id?: string;
  created_at: string;
}