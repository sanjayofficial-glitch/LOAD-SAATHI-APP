-- Enable RLS
alter table if exists public.users enable row level security;
alter table if exists public.trips enable row level security;
alter table if exists public.requests enable row level security;
alter table if exists public.notifications enable row level security;

-- Users table (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  user_type text check (user_type in ('trucker', 'shipper')) not null,
  full_name text not null,
  phone text not null,
  company_name text,
  is_verified boolean default false,
  rating numeric default 0,
  total_trips integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trips table
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  trucker_id uuid references public.users(id) on delete cascade not null,
  origin_city text not null,
  destination_city text not null,
  departure_date date not null,
  available_capacity_tonnes numeric not null,
  price_per_tonne numeric not null,
  vehicle_type text not null,
  vehicle_number text not null,
  status text check (status in ('active', 'completed', 'cancelled')) default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Requests table
create table if not exists public.requests (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  shipper_id uuid references public.users(id) on delete cascade not null,
  goods_description text not null,
  weight_tonnes numeric not null,
  pickup_address text not null,
  delivery_address text not null,
  status text check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(trip_id, shipper_id) -- Prevent duplicate requests
);

-- Notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  is_read boolean default false,
  related_trip_id uuid references public.trips(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for better performance
create index if not exists trips_trucker_id_idx on public.trips(trucker_id);
create index if not exists trips_status_idx on public.trips(status);
create index if not exists trips_route_idx on public.trips(origin_city, destination_city);
create index if not exists requests_trip_id_idx on public.requests(trip_id);
create index if not exists requests_shipper_id_idx on public.requests(shipper_id);
create index if not exists requests_status_idx on public.requests(status);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_is_read_idx on public.notifications(is_read);

-- RLS Policies

-- Users: Users can read all users, but only update their own
create policy "Users are viewable by everyone" on public.users
  for select using (true);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

-- Trips: Anyone can view active trips, truckers can view all their trips
create policy "Active trips are viewable by everyone" on public.trips
  for select using (status = 'active');

create policy "Truckers can view their own trips" on public.trips
  for select using (auth.uid() = trucker_id);

create policy "Truckers can insert their own trips" on public.trips
  for insert with check (auth.uid() = trucker_id);

create policy "Truckers can update their own trips" on public.trips
  for update using (auth.uid() = trucker_id);

-- Requests: Users can view requests they're involved in
create policy "Shippers can view their own requests" on public.requests
  for select using (auth.uid() = shipper_id);

create policy "Truckers can view requests for their trips" on public.requests
  for select using (
    exists (
      select 1 from public.trips 
      where trips.id = requests.trip_id 
      and trips.trucker_id = auth.uid()
    )
  );

create policy "Shippers can insert requests" on public.requests
  for insert with check (auth.uid() = shipper_id);

create policy "Truckers can update requests for their trips" on public.requests
  for update using (
    exists (
      select 1 from public.trips 
      where trips.id = requests.trip_id 
      and trips.trucker_id = auth.uid()
    )
  );

-- Notifications: Users can only see their own notifications
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can insert own notifications" on public.notifications
  for insert with check (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Functions

-- Function to update user stats when a trip is completed
create or replace function public.update_user_stats()
returns trigger as $$
begin
  if (new.status = 'accepted') then
    -- Increment total_trips for both trucker and shipper
    update public.users 
    set total_trips = total_trips + 1 
    where id in (new.shipper_id, (select trucker_id from public.trips where id = new.trip_id));
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update stats when request is accepted
create trigger update_user_stats_on_accept
  after update on public.requests
  for each row
  when (new.status = 'accepted' and old.status != 'accepted')
  execute function public.update_user_stats();

-- Function to create notification when request is created
create or replace function public.create_request_notification()
returns trigger as $$
declare
  trucker_id uuid;
begin
  -- Get the trucker_id from the trip
  select trucker_id into trucker_id from public.trips where id = new.trip_id;
  
  -- Create notification for trucker
  insert into public.notifications (user_id, message, related_trip_id)
  values (
    trucker_id,
    'New booking request for your trip!',
    new.trip_id
  );
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create notification when request is created
create trigger create_request_notification
  after insert on public.requests
  for each row
  execute function public.create_request_notification();

-- Function to create notification when request status changes
create or replace function public.create_status_notification()
returns trigger as $$
begin
  if (new.status != old.status) then
    -- Notify shipper about status change
    insert into public.notifications (user_id, message, related_trip_id)
    values (
      new.shipper_id,
      case 
        when new.status = 'accepted' then 'Your booking request has been accepted!'
        when new.status = 'declined' then 'Your booking request has been declined.'
        else 'Your booking request status has been updated.'
      end,
      new.trip_id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create notification when request status changes
create trigger create_status_notification
  after update on public.requests
  for each row
  when (new.status != old.status)
  execute function public.create_status_notification();