import { Router } from 'express';

const router = Router();

const mockVehicles = [
  { id: 'v1', plate_number: 'CA-8832F', type: '20ft Container', capacity_lbs: 44000, status: 'active', mileage: 45000 },
  { id: 'v2', plate_number: 'TX-4521B', type: '40ft Container', capacity_lbs: 63000, status: 'maintenance', mileage: 120000 },
  { id: 'v3', plate_number: 'OH-1029K', type: 'Box Truck', capacity_lbs: 22000, status: 'active', mileage: 15000 },
  { id: 'v4', plate_number: 'NY-3342M', type: 'Dry Van', capacity_lbs: 33000, status: 'idle', mileage: 8000 },
  { id: 'v5', plate_number: 'FL-9921D', type: 'Pickup', capacity_lbs: 4400, status: 'active', mileage: 25000 },
  { id: 'v6', plate_number: 'WA-7721A', type: '20ft Container', capacity_lbs: 44000, status: 'active', mileage: 35000 },
  { id: 'v7', plate_number: 'IL-5532P', type: '40ft Container', capacity_lbs: 63000, status: 'idle', mileage: 65000 },
  { id: 'v8', plate_number: 'GA-1123Q', type: 'Box Truck', capacity_lbs: 22000, status: 'maintenance', mileage: 90000 }
];

const mockDrivers = [
  { id: 'd1', name: 'James Carter', license_number: 'CDL-CA-88213', status: 'available', phone: '+1 (555) 234-8871' },
  { id: 'd2', name: 'Michael Rodriguez', license_number: 'CDL-TX-45213', status: 'on_duty', phone: '+1 (555) 345-9912' },
  { id: 'd3', name: 'Sarah Johnson', license_number: 'CDL-OH-10293', status: 'available', phone: '+1 (555) 456-1123' },
  { id: 'd4', name: 'David Martinez', license_number: 'CDL-NY-33423', status: 'on_duty', phone: '+1 (555) 567-2234' },
  { id: 'd5', name: 'John Smith', license_number: 'CDL-FL-99213', status: 'available', phone: '+1 (555) 678-3345' },
  { id: 'd6', name: 'Robert Williams', license_number: 'CDL-WA-77213', status: 'on_duty', phone: '+1 (555) 789-4456' },
  { id: 'd7', name: 'Mary Brown', license_number: 'CDL-IL-55323', status: 'available', phone: '+1 (555) 890-5567' },
  { id: 'd8', name: 'William Davis', license_number: 'CDL-GA-11233', status: 'available', phone: '+1 (555) 901-6678' }
];

// GET all vehicles
router.get('/vehicles', (req, res) => {
  res.json(mockVehicles);
});

// GET all drivers
router.get('/drivers', (req, res) => {
  res.json(mockDrivers);
});

// POST new vehicle
router.post('/vehicles', (req, res) => {
  const { plate_number, type, capacity_lbs } = req.body;
  const newVehicle = {
    id: 'v' + Date.now(),
    plate_number,
    type,
    capacity_lbs: Number(capacity_lbs),
    status: 'active',
    mileage: 0
  };
  mockVehicles.push(newVehicle);
  res.json(newVehicle);
});

// POST new driver
router.post('/drivers', (req, res) => {
  const { name, license_number, phone } = req.body;
  const newDriver = {
    id: 'd' + Date.now(),
    name,
    license_number,
    status: 'available',
    phone
  };
  mockDrivers.push(newDriver);
  res.json(newDriver);
});

export default router;
