import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Activity multipliers for TDEE
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function calculateTDEE(age: number, sex: string, height_cm: number, weight_kg: number, activity_level: string): number {
  // Mifflin-St Jeor BMR
  let bmr: number;
  if (sex === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }
  return bmr * (ACTIVITY_MULTIPLIERS[activity_level] || 1.55);
}

// Get active goal with suggestions
router.get('/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const goalResult = await query(
      'SELECT * FROM weight_goals WHERE user_id = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1',
      [req.userId]
    );

    if (goalResult.rows.length === 0) {
      res.json(null);
      return;
    }

    const goal = goalResult.rows[0];

    // Get latest weight
    const weightResult = await query(
      'SELECT weight_kg FROM weight_logs WHERE user_id = $1 ORDER BY date DESC LIMIT 1',
      [req.userId]
    );
    const currentWeight = weightResult.rows[0]?.weight_kg ?? goal.start_weight_kg;

    // Calculate weekly weight change needed
    const today = new Date();
    const targetDate = new Date(goal.target_date);
    const weeksRemaining = Math.max(1, (targetDate.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const remainingWeightChange = goal.target_weight_kg - parseFloat(currentWeight);
    const weeklyWeightChange = remainingWeightChange / weeksRemaining;

    // Get user profile for TDEE
    const userResult = await query(
      'SELECT age, sex, height_cm, activity_level FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    let suggestions = null;
    if (user.age && user.sex && user.height_cm) {
      const tdee = calculateTDEE(user.age, user.sex, parseFloat(user.height_cm), parseFloat(currentWeight), user.activity_level);
      // 1 kg fat ≈ 7700 kcal; 1 lb fat ≈ 3500 kcal
      const dailyCalorieAdjustment = (weeklyWeightChange * 7700) / 7;
      const targetCalories = Math.round(tdee + dailyCalorieAdjustment);
      // ~1g protein per lb of target bodyweight
      const targetProtein = Math.round(parseFloat(goal.target_weight_kg) * 2.205);

      suggestions = {
        tdee: Math.round(tdee),
        targetCalories,
        targetProtein,
        weeklyWeightChange: parseFloat(weeklyWeightChange.toFixed(2)),
        weeksRemaining: parseFloat(weeksRemaining.toFixed(1)),
        currentWeight: parseFloat(currentWeight),
      };
    }

    res.json({ goal, suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all goals
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT * FROM weight_goals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create goal
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { target_weight_kg, start_weight_kg, start_date, target_date } = req.body;
  if (!target_weight_kg || !start_weight_kg || !start_date || !target_date) {
    res.status(400).json({ error: 'target_weight_kg, start_weight_kg, start_date, target_date are required' });
    return;
  }

  try {
    // Deactivate old goals
    await query('UPDATE weight_goals SET is_active = FALSE WHERE user_id = $1', [req.userId]);

    const result = await query(
      `INSERT INTO weight_goals (user_id, target_weight_kg, start_weight_kg, start_date, target_date, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
      [req.userId, target_weight_kg, start_weight_kg, start_date, target_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
