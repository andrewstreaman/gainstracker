import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import goalRoutes from './routes/goals';
import logRoutes from './routes/logs';
import challengeRoutes from './routes/challenges';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/challenges', challengeRoutes);

app.listen(PORT, () => {
  console.log(`GainTracker API running on port ${PORT}`);
});

export default app;
