-- 0001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'dispatcher', 'driver')),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VEHICLES (TRUCKS) TABLE
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., '20ft Container', '40ft Container', 'Box Truck'
    capacity_kg INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, maintenance, idle
    mileage INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DRIVERS TABLE
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'available', -- available, on_duty, off_duty
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VEHICLE ASSIGNMENTS
CREATE TABLE vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- MAINTENANCE RECORDS
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    maintenance_date DATE NOT NULL,
    cost DECIMAL(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SEED DATA

-- Users
INSERT INTO users (id, email, role, name) VALUES 
('11111111-1111-1111-1111-111111111111', 'admin@roadstar.com', 'admin', 'System Admin'),
('22222222-2222-2222-2222-222222222222', 'dispatcher1@roadstar.com', 'dispatcher', 'Dispatcher John'),
('d0000000-0000-0000-0000-000000000001', 'driver1@roadstar.com', 'driver', 'Driver One'),
('d0000000-0000-0000-0000-000000000002', 'driver2@roadstar.com', 'driver', 'Driver Two'),
('d0000000-0000-0000-0000-000000000003', 'driver3@roadstar.com', 'driver', 'Driver Three'),
('d0000000-0000-0000-0000-000000000004', 'driver4@roadstar.com', 'driver', 'Driver Four'),
('d0000000-0000-0000-0000-000000000005', 'driver5@roadstar.com', 'driver', 'Driver Five'),
('d0000000-0000-0000-0000-000000000006', 'driver6@roadstar.com', 'driver', 'Driver Six'),
('d0000000-0000-0000-0000-000000000007', 'driver7@roadstar.com', 'driver', 'Driver Seven'),
('d0000000-0000-0000-0000-000000000008', 'driver8@roadstar.com', 'driver', 'Driver Eight');

-- Drivers
INSERT INTO drivers (id, user_id, license_number, status, phone) VALUES 
('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'd0000000-0000-0000-0000-000000000001', 'SIM-B2-001', 'available', '081234567801'),
('dddddddd-dddd-dddd-dddd-ddddddddddd2', 'd0000000-0000-0000-0000-000000000002', 'SIM-B2-002', 'available', '081234567802'),
('dddddddd-dddd-dddd-dddd-ddddddddddd3', 'd0000000-0000-0000-0000-000000000003', 'SIM-B2-003', 'available', '081234567803'),
('dddddddd-dddd-dddd-dddd-ddddddddddd4', 'd0000000-0000-0000-0000-000000000004', 'SIM-B2-004', 'on_duty', '081234567804'),
('dddddddd-dddd-dddd-dddd-ddddddddddd5', 'd0000000-0000-0000-0000-000000000005', 'SIM-B2-005', 'on_duty', '081234567805'),
('dddddddd-dddd-dddd-dddd-ddddddddddd6', 'd0000000-0000-0000-0000-000000000006', 'SIM-B2-006', 'off_duty', '081234567806'),
('dddddddd-dddd-dddd-dddd-ddddddddddd7', 'd0000000-0000-0000-0000-000000000007', 'SIM-B2-007', 'available', '081234567807'),
('dddddddd-dddd-dddd-dddd-ddddddddddd8', 'd0000000-0000-0000-0000-000000000008', 'SIM-B2-008', 'available', '081234567808');

-- Vehicles (Trucks)
INSERT INTO vehicles (id, plate_number, type, capacity_kg, status, mileage) VALUES 
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv1', 'B 1234 ABC', '20ft Container', 28000, 'active', 45000),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv2', 'B 2345 BCD', '40ft Container', 28800, 'active', 120000),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv3', 'B 3456 CDE', 'Box Truck', 10000, 'idle', 30000),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv4', 'B 4567 DEF', '20ft Container', 28000, 'active', 55000),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv5', 'B 5678 EFG', '40ft Container', 28800, 'maintenance', 210000),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv6', 'B 6789 FGH', 'Box Truck', 10000, 'active', 15000),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv7', 'B 7890 GHI', '20ft Container', 28000, 'idle', 85000),
('vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv8', 'B 8901 HIJ', '40ft Container', 28800, 'active', 105000);

-- Maintenance Records
INSERT INTO maintenance_records (id, vehicle_id, description, maintenance_date, cost, status) VALUES 
(uuid_generate_v4(), 'vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv5', 'Engine overhaul', '2026-09-01', 15000000, 'in_progress'),
(uuid_generate_v4(), 'vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvv2', 'Tire replacement', '2026-08-15', 4000000, 'completed');
