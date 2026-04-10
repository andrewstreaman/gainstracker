import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DailySummary, WeightGoal, GoalSuggestions } from '../types';
import { kgToLbs } from '../utils/units';

interface GoalResponse {
  goal: WeightGoal;
  suggestions: GoalSuggestions | null;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [goalData, setGoalData] = useState<GoalResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DailySummary>(`/logs/summary/${today}`),
      api.get<GoalResponse | null>('/goals/active'),
    ]).then(([s, g]) => {
      setSummary(s.data);
      setGoalData(g.data);
    }).finally(() => setLoading(false));
  }, [today]);

  if (loading) return <div className="text-gray-500 text-sm">Loading…</div>;

  const s = goalData?.suggestions;

  const displayWeight = summary?.weight
    ? `${kgToLbs(parseFloat(String(summary.weight.weight_kg)))} lbs`
    : '—';

  const displayAvg = summary?.sevenDayAvgWeight
    ? `7-day avg: ${kgToLbs(parseFloat(summary.sevenDayAvgWeight))} lbs`
    : 'Not logged yet';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Today's Weight" value={displayWeight} sub={displayAvg} />
        <StatCard
          label="Calories"
          value={summary ? `${summary.nutritionTotals.calories}` : '—'}
          sub={s ? `Target: ${s.targetCalories} kcal` : undefined}
        />
        <StatCard
          label="Protein"
          value={summary ? `${summary.nutritionTotals.protein_g.toFixed(0)}g` : '—'}
          sub={s ? `Target: ${s.targetProtein}g` : undefined}
        />
        <StatCard
          label="Exercises"
          value={summary ? `${summary.exercise.length}` : '—'}
          sub={summary?.exercise[0]?.exercise_type}
        />
      </div>

      {/* Goal card */}
      {goalData?.goal ? (
        <div className="bg-brand-900/40 border border-brand-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-brand-300">Active Goal</h2>
            <Link to="/goal" className="text-xs text-brand-400 hover:underline">Edit</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-brand-400 font-medium">Target Weight</p>
              <p className="text-white font-bold text-lg">
                {kgToLbs(parseFloat(String(goalData.goal.target_weight_kg)))} lbs
              </p>
            </div>
            <div>
              <p className="text-brand-400 font-medium">Target Date</p>
              <p className="text-white font-bold">
                {format(new Date(goalData.goal.target_date), 'MMM d, yyyy')}
              </p>
            </div>
            {s && (
              <>
                <div>
                  <p className="text-brand-400 font-medium">Weekly Change</p>
                  <p className="text-white font-bold">
                    {s.weeklyWeightChange > 0 ? '+' : ''}
                    {kgToLbs(s.weeklyWeightChange)} lbs/wk
                  </p>
                </div>
                <div>
                  <p className="text-brand-400 font-medium">Weeks Left</p>
                  <p className="text-white font-bold">{s.weeksRemaining}</p>
                </div>
              </>
            )}
          </div>
          {s && (
            <div className="mt-4 pt-4 border-t border-brand-800 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-brand-400 font-medium">Daily Calorie Target</p>
                <p className="text-white font-bold text-lg">{s.targetCalories.toLocaleString()} kcal</p>
                <p className="text-brand-600 text-xs">TDEE: {s.tdee.toLocaleString()} kcal</p>
              </div>
              <div>
                <p className="text-brand-400 font-medium">Daily Protein Target</p>
                <p className="text-white font-bold text-lg">{s.targetProtein}g</p>
                <p className="text-brand-600 text-xs">~1g per lb of target weight</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-5">
          <p className="text-yellow-300 font-medium">No active goal set.</p>
          <Link to="/goal" className="text-yellow-400 text-sm hover:underline">Set your first goal →</Link>
        </div>
      )}

      {/* Quick log shortcut */}
      <div className="flex gap-3">
        <Link
          to="/log"
          className="flex-1 bg-brand-600 hover:bg-brand-500 text-white text-center font-semibold rounded-xl py-3 transition-colors"
        >
          📝 Log Today
        </Link>
        <Link
          to="/progress"
          className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-center font-semibold rounded-xl py-3 transition-colors"
        >
          📈 View Progress
        </Link>
      </div>

      {/* Today's nutrition log */}
      {summary && summary.nutrition.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h3 className="font-semibold text-gray-200 mb-3">Today's Meals</h3>
          <div className="space-y-2">
            {summary.nutrition.map((n) => (
              <div key={n.id} className="flex justify-between text-sm">
                <span className="text-gray-300">{n.meal_name || 'Entry'}</span>
                <span className="text-gray-500">{n.calories} kcal · {n.protein_g}g protein</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's exercise log */}
      {summary && summary.exercise.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h3 className="font-semibold text-gray-200 mb-3">Today's Exercise</h3>
          <div className="space-y-2">
            {summary.exercise.map((e) => (
              <div key={e.id} className="flex justify-between text-sm">
                <span className="text-gray-300">{e.exercise_type}</span>
                <span className="text-gray-500">{e.duration_minutes} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
