import { Router } from 'express';

const router = Router();

// In-memory mock data for Loads
const today = new Date().toISOString().split('T')[0];
let mockLoads = [
  { id: 'l1', origin: 'Dallas, TX', destination: 'Houston, TX', weight_lbs: 33000, date: today, status: 'new', assigned_vehicle_id: null, assigned_driver_id: null },
  { id: 'l2', origin: 'Chicago, IL', destination: 'Indianapolis, IN', weight_lbs: 61000, date: today, status: 'matched', assigned_vehicle_id: 'v1', assigned_driver_id: 'd1' },
  { id: 'l3', origin: 'Los Angeles, CA', destination: 'Phoenix, AZ', weight_lbs: 17000, date: today, status: 'in_transit', assigned_vehicle_id: 'v2', assigned_driver_id: 'd2' },
  { id: 'l4', origin: 'Atlanta, GA', destination: 'Charlotte, NC', weight_lbs: 10000, date: today, status: 'delivered', assigned_vehicle_id: 'v3', assigned_driver_id: 'd3' },
  { id: 'l5', origin: 'Denver, CO', destination: 'Salt Lake City, UT', weight_lbs: 26000, date: today, status: 'new', assigned_vehicle_id: null, assigned_driver_id: null },
  { id: 'l6', origin: 'Seattle, WA', destination: 'Portland, OR', weight_lbs: 11000, date: today, status: 'new', assigned_vehicle_id: null, assigned_driver_id: null },
  { id: 'l7', origin: 'Miami, FL', destination: 'Orlando, FL', weight_lbs: 20000, date: today, status: 'matched', assigned_vehicle_id: 'v4', assigned_driver_id: 'd4' },
  { id: 'l8', origin: 'Boston, MA', destination: 'New York, NY', weight_lbs: 15000, date: today, status: 'matched', assigned_vehicle_id: 'v5', assigned_driver_id: 'd5' },
  { id: 'l9', origin: 'Detroit, MI', destination: 'Cleveland, OH', weight_lbs: 24000, date: today, status: 'in_transit', assigned_vehicle_id: 'v6', assigned_driver_id: 'd6' },
  { id: 'l10', origin: 'Minneapolis, MN', destination: 'Milwaukee, WI', weight_lbs: 39000, date: today, status: 'in_transit', assigned_vehicle_id: 'v7', assigned_driver_id: 'd7' },
  { id: 'l11', origin: 'Philadelphia, PA', destination: 'Baltimore, MD', weight_lbs: 44000, date: today, status: 'delivered', assigned_vehicle_id: 'v8', assigned_driver_id: 'd8' },
  { id: 'l12', origin: 'Las Vegas, NV', destination: 'San Diego, CA', weight_lbs: 13000, date: today, status: 'delivered', assigned_vehicle_id: 'v1', assigned_driver_id: 'd2' }
];

// GET all loads
router.get('/', (req, res) => {
  res.json(mockLoads);
});

// PUT update load (status, assignment, etc)
router.put('/:id', (req, res) => {
  const index = mockLoads.findIndex(l => l.id === req.params.id);
  if (index !== -1) {
    mockLoads[index] = { ...mockLoads[index], ...req.body };
    res.json(mockLoads[index]);
  } else {
    res.status(404).json({ error: 'Load not found' });
  }
});

// POST new load (optional, for completeness)
router.post('/', (req, res) => {
  const newLoad = {
    id: 'l' + Date.now(),
    status: 'new',
    assigned_vehicle_id: null,
    assigned_driver_id: null,
    ...req.body
  };
  mockLoads.push(newLoad);
  res.json(newLoad);
});

export default router;
