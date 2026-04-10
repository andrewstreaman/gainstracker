import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import { WeightGoal, GoalSuggestions } from '../types';
import { kgToLbs, lbsToKg } from '../utils/units';

interface GoalResponse {
  goal: WeightGoal;
  suggestions: GoalSuggestions | null;
}

const inputCls = 'w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function GoalPage() {
  const [goalData, setGoalData] = useState<GoalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form state in lbs (converted to kg on submit)
  const [targetWeightLbs, setTargetWeightLbs] = useState('');
  const [startWeightLbs, setStartWeightLbs] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    api.get<GoalResponse | null>('/goals/active').then((r) => {
      setGoalData(r.data);
      if (r.data?.goal) {
        const g = r.data.goal;
        setTargetWeightLbs(String(kgToLbs(parseFloat(String(g.target_weight_kg)))));
        setStartWeightLbs(String(kgToLbs(parseFloat(String(g.start_weight_kg)))));
        setStartDate(g.start_date.split('T')[0]);
        setTargetDate(g.target_date.split('T')[0]);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/goals', {
        target_weight_kg: lbsToKg(parseFloat(targetWeightLbs)),
        start_weight_kg: lbsToKg(parseFloat(startWeightLbs)),
        start_date: startDate,
        target_date: targetDate,
      });
      const r = await api.get<GoalResponse>('/goals/active');
      setGoalData(r.data);
      setMessage('Goal saved!');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading…</div>;

  const s = goalData?.suggestions;

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-white">Weight Goal</h1>

      {message && (
        <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm">
          {message}
        </div>
      )}

      {/* Current suggestions */}
      {s && (
        <div className="bg-brand-900/40 border border-brand-800 rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-brand-300">Your Recommendations</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-brand-400 font-medium uppercase tracking-wide">Weekly Target</p>
              <p className="text-xl font-bold text-white">
                {s.weeklyWeightChange > 0 ? '+' : ''}{kgToLbs(s.weeklyWeightChange)} lbs/wk
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-400 font-medium uppercase tracking-wide">Weeks Remaining</p>
              <p className="text-xl font-bold text-white">{s.weeksRemaining}</p>
            </div>
            <div>
              <p className="text-xs text-brand-400 font-medium uppercase tracking-wide">Daily Calories</p>
              <p className="text-xl font-bold text-white">{s.targetCalories.toLocaleString()} kcal</p>
              <p className="text-xs text-brand-600">TDEE: {s.tdee.toLocaleString()} kcal</p>
            </div>
            <div>
              <p className="text-xs text-brand-400 font-medium uppercase tracking-wide">Daily Protein</p>
              <p className="text-xl font-bold text-white">{s.targetProtein}g</p>
              <p className="text-xs text-brand-600">~1g per lb target BW</p>
            </div>
          </div>
          <p className="text-xs text-brand-600 border-t border-brand-900 pt-3">
            Calories calculated using Mifflin-St Jeor TDEE estimation.
            A {Math.abs(kgToLbs(s.weeklyWeightChange))} lbs/week change requires a
            ~{Math.abs(Math.round(s.weeklyWeightChange * 7700 / 7))} kcal/day
            {s.weeklyWeightChange > 0 ? ' surplus' : ' deficit'}.
          </p>
        </div>
      )}

      {/* Goal form */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h2 className="font-semibold text-gray-200 mb-4">
          {goalData?.goal ? 'Update Goal' : 'Set Your Goal'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Starting Weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                value={startWeightLbs}
                onChange={(e) => setStartWeightLbs(e.target.value)}
                required
                placeholder="180.0"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Target Weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                value={targetWeightLbs}
                onChange={(e) => setTargetWeightLbs(e.target.value)}
                required
                placeholder="165.0"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
                min={startDate}
                className={inputCls}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            For accurate calorie/protein suggestions, make sure your profile has age, sex, height, and activity level set.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Goal'}
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-600">
        Setting a new goal deactivates any existing goal. Historical logs are preserved.
      </p>
    </div>
  );
}
