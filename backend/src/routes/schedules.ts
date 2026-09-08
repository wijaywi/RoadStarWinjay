import { Router } from 'express';

const router = Router();

// In-memory mock data for schedules
const todayStr = new Date().toISOString().split('T')[0];
let mockSchedules = [
  { id: 's1', driver_id: 'd1', date: todayStr, start_time: '08:00', end_time: '16:00', type: 'delivery' },
  { id: 's2', driver_id: 'd2', date: todayStr, start_time: '06:00', end_time: '14:00', type: 'long_haul' },
  { id: 's3', driver_id: 'd3', date: todayStr, start_time: '14:00', end_time: '22:00', type: 'delivery' },
  { id: 's4', driver_id: 'd4', date: todayStr, start_time: '09:00', end_time: '17:00', type: 'local' },
  { id: 's5', driver_id: 'd5', date: todayStr, start_time: '07:00', end_time: '15:00', type: 'delivery' },
  { id: 's6', driver_id: 'd6', date: todayStr, start_time: '10:00', end_time: '18:00', type: 'maintenance_run' },
  { id: 's7', driver_id: 'd7', date: todayStr, start_time: '12:00', end_time: '20:00', type: 'delivery' },
  { id: 's8', driver_id: 'd8', date: todayStr, start_time: '05:00', end_time: '13:00', type: 'long_haul' }
];

// GET all schedules
router.get('/', (req, res) => {
  res.json(mockSchedules);
});

// POST new schedule
router.post('/', (req, res) => {
  const { driver_id, date, start_time, end_time, type } = req.body;
  const newSchedule = {
    id: 's' + Date.now(),
    driver_id,
    date,
    start_time,
    end_time,
    type: type || 'delivery'
  };
  mockSchedules.push(newSchedule);
  res.json(newSchedule);
});

// DELETE schedule
router.delete('/:id', (req, res) => {
  mockSchedules = mockSchedules.filter(s => s.id !== req.params.id);
  res.json({ success: true });
});

export default router;
