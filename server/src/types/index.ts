export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  sex?: 'male' | 'female';
  height_cm?: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  created_at: string;
}

export interface WeightGoal {
  id: string;
  user_id: string;
  target_weight_kg: number;
  start_weight_kg: number;
  start_date: string;
  target_date: string;
  is_active: boolean;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  user_id: string;
  date: string;
  exercise_type: string;
  duration_minutes: number;
  notes?: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  meal_name?: string;
  calories: number;
  protein_g: number;
  notes?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_by: string;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export interface ChallengeMember {
  challenge_id: string;
  user_id: string;
  joined_at: string;
  user_name: string;
  user_email: string;
}

export interface AuthRequest extends Express.Request {
  userId?: string;
}

// Declare module augmentation for Express
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
