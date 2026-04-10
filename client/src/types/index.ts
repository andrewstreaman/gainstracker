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
}

export interface GoalSuggestions {
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  weeklyWeightChange: number;
  weeksRemaining: number;
  currentWeight: number;
}

export interface WeightLog {
  id: string;
  date: string;
  weight_kg: number;
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  date: string;
  exercise_type: string;
  duration_minutes: number;
  notes?: string;
}

export interface NutritionLog {
  id: string;
  date: string;
  meal_name?: string;
  calories: number;
  protein_g: number;
  notes?: string;
}

export interface DailySummary {
  date: string;
  weight: WeightLog | null;
  sevenDayAvgWeight: string | null;
  exercise: ExerciseLog[];
  nutrition: NutritionLog[];
  nutritionTotals: { calories: number; protein_g: number };
}

export interface ChallengeMember {
  id: string;
  name: string;
  joined_at: string;
  goal: {
    target_weight_kg: number;
    start_weight_kg: number;
    target_date: string;
  } | null;
  current_weight: number | null;
  streak: number;
  adherence: number;
  goalProgress: number | null;
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
  creator_name?: string;
  member_count?: number;
}

export interface ChallengeDetail {
  challenge: Challenge;
  members: ChallengeMember[];
}
