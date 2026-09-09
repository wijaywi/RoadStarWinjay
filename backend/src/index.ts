import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fleetRoutes from './routes/fleet';
import schedulesRoutes from './routes/schedules';
import loadsRoutes from './routes/loads';
import insightsRoutes from './routes/insights';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/fleet', fleetRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/loads', loadsRoutes);
app.use('/api/insights', insightsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoadStar Winjay API is running' });
});

if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
