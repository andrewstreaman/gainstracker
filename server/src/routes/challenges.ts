import { Router, Request, Response } from 'express';
import { query } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Get all challenges for current user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT c.*, u.name as creator_name,
        (SELECT COUNT(*) FROM challenge_members cm WHERE cm.challenge_id = c.id) as member_count
       FROM challenges c
       JOIN challenge_members cm ON cm.challenge_id = c.id
       JOIN users u ON u.id = c.created_by
       WHERE cm.user_id = $1
       ORDER BY c.created_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create challenge
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, description, start_date, end_date } = req.body;
  if (!name || !start_date) {
    res.status(400).json({ error: 'name and start_date are required' });
    return;
  }

  try {
    let invite_code = generateInviteCode();
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 10) {
      const exists = await query('SELECT id FROM challenges WHERE invite_code = $1', [invite_code]);
      if (exists.rows.length === 0) break;
      invite_code = generateInviteCode();
      attempts++;
    }

    const result = await query(
      `INSERT INTO challenges (name, description, invite_code, created_by, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description || null, invite_code, req.userId, start_date, end_date || null]
    );
    const challenge = result.rows[0];

    // Auto-join creator
    await query(
      'INSERT INTO challenge_members (challenge_id, user_id) VALUES ($1, $2)',
      [challenge.id, req.userId]
    );

    res.status(201).json(challenge);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join via invite code
router.post('/join', async (req: Request, res: Response): Promise<void> => {
  const { invite_code } = req.body;
  if (!invite_code) {
    res.status(400).json({ error: 'invite_code is required' });
    return;
  }

  try {
    const challengeResult = await query(
      'SELECT * FROM challenges WHERE invite_code = $1',
      [invite_code.toUpperCase()]
    );
    if (challengeResult.rows.length === 0) {
      res.status(404).json({ error: 'Challenge not found' });
      return;
    }

    const challenge = challengeResult.rows[0];
    await query(
      'INSERT INTO challenge_members (challenge_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [challenge.id, req.userId]
    );

    res.json(challenge);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get challenge detail + leaderboard
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    // Check membership
    const memberCheck = await query(
      'SELECT id FROM challenge_members WHERE challenge_id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not a member of this challenge' });
      return;
    }

    const challengeResult = await query('SELECT * FROM challenges WHERE id = $1', [id]);
    if (challengeResult.rows.length === 0) {
      res.status(404).json({ error: 'Challenge not found' });
      return;
    }

    const challenge = challengeResult.rows[0];

    // Get members with their goal and progress data
    const membersResult = await query(
      `SELECT
        u.id, u.name, u.email,
        cm.joined_at,
        wg.target_weight_kg, wg.start_weight_kg, wg.start_date, wg.target_date,
        (SELECT weight_kg FROM weight_logs wl WHERE wl.user_id = u.id ORDER BY date DESC LIMIT 1) as current_weight,
        (SELECT COUNT(DISTINCT date) FROM weight_logs wl2
         WHERE wl2.user_id = u.id AND wl2.date >= $2) as days_logged
       FROM challenge_members cm
       JOIN users u ON u.id = cm.user_id
       LEFT JOIN weight_goals wg ON wg.user_id = u.id AND wg.is_active = TRUE
       WHERE cm.challenge_id = $1`,
      [id, challenge.start_date]
    );

    // Calculate streak and adherence for each member
    const members = await Promise.all(membersResult.rows.map(async (member) => {
      // Streak: consecutive days logged (weight or nutrition)
      const streakResult = await query(
        `WITH logged_dates AS (
          SELECT DISTINCT date FROM weight_logs WHERE user_id = $1
          UNION
          SELECT DISTINCT date FROM nutrition_logs WHERE user_id = $1
        ),
        ranked AS (
          SELECT date,
            date - (ROW_NUMBER() OVER (ORDER BY date))::integer AS grp
          FROM logged_dates
        )
        SELECT COUNT(*) as streak
        FROM ranked
        WHERE grp = (
          SELECT date - (ROW_NUMBER() OVER (ORDER BY date))::integer
          FROM ranked
          ORDER BY date DESC
          LIMIT 1
        )`,
        [member.id]
      );

      // Adherence: % of days since challenge start with a log
      const daysSinceStart = Math.max(1, Math.ceil(
        (Date.now() - new Date(challenge.start_date).getTime()) / (24 * 60 * 60 * 1000)
      ));
      const adherence = Math.min(100, Math.round((parseInt(member.days_logged) / daysSinceStart) * 100));

      // Progress toward goal
      let goalProgress = null;
      if (member.target_weight_kg && member.start_weight_kg && member.current_weight) {
        const totalChange = parseFloat(member.target_weight_kg) - parseFloat(member.start_weight_kg);
        const actualChange = parseFloat(member.current_weight) - parseFloat(member.start_weight_kg);
        goalProgress = totalChange !== 0 ? Math.round((actualChange / totalChange) * 100) : 100;
      }

      return {
        id: member.id,
        name: member.name,
        joined_at: member.joined_at,
        goal: member.target_weight_kg ? {
          target_weight_kg: parseFloat(member.target_weight_kg),
          start_weight_kg: parseFloat(member.start_weight_kg),
          target_date: member.target_date,
        } : null,
        current_weight: member.current_weight ? parseFloat(member.current_weight) : null,
        streak: parseInt(streakResult.rows[0]?.streak || '0'),
        adherence,
        goalProgress,
      };
    }));

    // Sort by adherence descending (leaderboard)
    members.sort((a, b) => b.adherence - a.adherence);

    res.json({ challenge, members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a member's weight chart data (within a challenge)
router.get('/:id/members/:userId/weights', async (req: Request, res: Response): Promise<void> => {
  const { id, userId } = req.params;
  try {
    const memberCheck = await query(
      'SELECT id FROM challenge_members WHERE challenge_id = $1 AND user_id = $2',
      [id, req.userId]
    );
    if (memberCheck.rows.length === 0) {
      res.status(403).json({ error: 'Not a member of this challenge' });
      return;
    }

    const result = await query(
      'SELECT date, weight_kg FROM weight_logs WHERE user_id = $1 ORDER BY date ASC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave challenge
router.delete('/:id/leave', async (req: Request, res: Response): Promise<void> => {
  try {
    await query(
      'DELETE FROM challenge_members WHERE challenge_id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
