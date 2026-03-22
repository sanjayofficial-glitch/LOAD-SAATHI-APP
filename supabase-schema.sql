-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type VARCHAR(20) NOT NULL DEFAULT 'shipper',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trips table
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trucker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    origin_city VARCHAR(255) NOT NULL,
    destination_city VARCHAR(255) NOT NULL,
    departure_date TIMESTAMPTZ NOT NULL,
    available_capacity_tonnes NUMERIC(10,2) NOT NULL,
    price_per_tonne NUMERIC(10,2) NOT NULL,
    vehicle_type VARCHAR(255) NOT NULL,
    vehicle_number VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create requests table
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    shipper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goods_description TEXT NOT NULL,
    weight_tonnes NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for trips and requests
CREATE POLICY "public_read_access" ON trips FOR SELECT USING (true);
CREATE POLICY "public_read_access" ON requests FOR SELECT USING (true);

-- Create RLS policies for user-specific data
CREATE POLICY "user_specific_access" ON trips FOR ALL USING (trucker_id = current_setting('jwt.claims.user_id')::UUID);
CREATE POLICY "user_specific_access" ON requests FOR ALL USING (shipper_id = current_setting('jwt.claims.user_id')::UUID);
CREATE POLICY "user_specific_access" ON notifications FOR ALL USING (user_id = current_setting('jwt.claims.user_id')::UUID);