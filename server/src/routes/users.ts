import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get current user profile
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, email, name, age, sex, height_cm, activity_level, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/me', async (req: Request, res: Response): Promise<void> => {
  const { name, age, sex, height_cm, activity_level } = req.body;
  try {
    const result = await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        age = COALESCE($2, age),
        sex = COALESCE($3, sex),
        height_cm = COALESCE($4, height_cm),
        activity_level = COALESCE($5, activity_level),
        updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, name, age, sex, height_cm, activity_level`,
      [name, age, sex, height_cm, activity_level, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
