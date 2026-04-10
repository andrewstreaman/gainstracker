import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ── Weight Logs ──────────────────────────────────────────────────────────────

router.get('/weight', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT * FROM weight_logs WHERE user_id = $1 ORDER BY date DESC LIMIT 90',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/weight', async (req: Request, res: Response): Promise<void> => {
  const { date, weight_kg, notes } = req.body;
  if (!date || weight_kg == null) {
    res.status(400).json({ error: 'date and weight_kg are required' });
    return;
  }
  try {
    const result = await query(
      `INSERT INTO weight_logs (user_id, date, weight_kg, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date) DO UPDATE SET weight_kg = $3, notes = $4
       RETURNING *`,
      [req.userId, date, weight_kg, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/weight/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await query('DELETE FROM weight_logs WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Exercise Logs ─────────────────────────────────────────────────────────────

router.get('/exercise', async (req: Request, res: Response): Promise<void> => {
  const { from, to } = req.query;
  try {
    let q = 'SELECT * FROM exercise_logs WHERE user_id = $1';
    const params: unknown[] = [req.userId];
    if (from) { params.push(from); q += ` AND date >= $${params.length}`; }
    if (to) { params.push(to); q += ` AND date <= $${params.length}`; }
    q += ' ORDER BY date DESC, created_at DESC';
    const result = await query(q, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/exercise', async (req: Request, res: Response): Promise<void> => {
  const { date, exercise_type, duration_minutes, notes } = req.body;
  if (!date || !exercise_type || duration_minutes == null) {
    res.status(400).json({ error: 'date, exercise_type, and duration_minutes are required' });
    return;
  }
  try {
    const result = await query(
      `INSERT INTO exercise_logs (user_id, date, exercise_type, duration_minutes, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.userId, date, exercise_type, duration_minutes, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/exercise/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await query('DELETE FROM exercise_logs WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Nutrition Logs ────────────────────────────────────────────────────────────

router.get('/nutrition', async (req: Request, res: Response): Promise<void> => {
  const { from, to } = req.query;
  try {
    let q = 'SELECT * FROM nutrition_logs WHERE user_id = $1';
    const params: unknown[] = [req.userId];
    if (from) { params.push(from); q += ` AND date >= $${params.length}`; }
    if (to) { params.push(to); q += ` AND date <= $${params.length}`; }
    q += ' ORDER BY date DESC, created_at DESC';
    const result = await query(q, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/nutrition', async (req: Request, res: Response): Promise<void> => {
  const { date, meal_name, calories, protein_g, notes } = req.body;
  if (!date || calories == null || protein_g == null) {
    res.status(400).json({ error: 'date, calories, and protein_g are required' });
    return;
  }
  try {
    const result = await query(
      `INSERT INTO nutrition_logs (user_id, date, meal_name, calories, protein_g, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, date, meal_name || null, calories, protein_g, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/nutrition/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await query('DELETE FROM nutrition_logs WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Daily Summary ─────────────────────────────────────────────────────────────

router.get('/summary/:date', async (req: Request, res: Response): Promise<void> => {
  const { date } = req.params;
  try {
    const [weight, exercise, nutrition] = await Promise.all([
      query('SELECT * FROM weight_logs WHERE user_id = $1 AND date = $2', [req.userId, date]),
      query('SELECT * FROM exercise_logs WHERE user_id = $1 AND date = $2 ORDER BY created_at', [req.userId, date]),
      query('SELECT * FROM nutrition_logs WHERE user_id = $1 AND date = $2 ORDER BY created_at', [req.userId, date]),
    ]);

    // 7-day rolling average weight
    const avgResult = await query(
      `SELECT AVG(weight_kg) as avg_weight FROM weight_logs
       WHERE user_id = $1 AND date <= $2 AND date > ($2::date - INTERVAL '7 days')`,
      [req.userId, date]
    );

    const nutritionTotals = nutrition.rows.reduce(
      (acc: { calories: number; protein_g: number }, n: { calories: number; protein_g: number }) => ({
        calories: acc.calories + n.calories,
        protein_g: acc.protein_g + parseFloat(String(n.protein_g)),
      }),
      { calories: 0, protein_g: 0 }
    );

    res.json({
      date,
      weight: weight.rows[0] || null,
      sevenDayAvgWeight: avgResult.rows[0]?.avg_weight ? parseFloat(avgResult.rows[0].avg_weight).toFixed(1) : null,
      exercise: exercise.rows,
      nutrition: nutrition.rows,
      nutritionTotals,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
