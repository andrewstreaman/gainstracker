import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../services/api';
import { DailySummary, ExerciseLog, NutritionLog } from '../types';
import { kgToLbs, lbsToKg } from '../utils/units';

type Tab = 'weight' | 'exercise' | 'nutrition';

const inputCls = 'w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function LogPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tab, setTab] = useState<Tab>('weight');
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Weight form (user enters lbs, stored as kg)
  const [weightLbs, setWeightLbs] = useState('');
  const [weightNotes, setWeightNotes] = useState('');

  // Exercise form
  const [exerciseType, setExerciseType] = useState('');
  const [duration, setDuration] = useState('');
  const [exerciseNotes, setExerciseNotes] = useState('');

  // Nutrition form
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [nutritionNotes, setNutritionNotes] = useState('');

  const loadSummary = useCallback(async () => {
    const res = await api.get<DailySummary>(`/logs/summary/${date}`);
    setSummary(res.data);
    if (res.data.weight) {
      setWeightLbs(String(kgToLbs(parseFloat(String(res.data.weight.weight_kg)))));
      setWeightNotes(res.data.weight.notes || '');
    } else {
      setWeightLbs('');
      setWeightNotes('');
    }
  }, [date]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const saveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/logs/weight', {
        date,
        weight_kg: lbsToKg(parseFloat(weightLbs)),
        notes: weightNotes,
      });
      showMessage('Weight saved!');
      loadSummary();
    } finally {
      setSaving(false);
    }
  };

  const deleteWeight = async () => {
    if (!summary?.weight) return;
    await api.delete(`/logs/weight/${summary.weight.id}`);
    showMessage('Weight deleted');
    loadSummary();
  };

  const saveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/logs/exercise', {
        date,
        exercise_type: exerciseType,
        duration_minutes: parseInt(duration),
        notes: exerciseNotes,
      });
      showMessage('Exercise logged!');
      setExerciseType(''); setDuration(''); setExerciseNotes('');
      loadSummary();
    } finally {
      setSaving(false);
    }
  };

  const deleteExercise = async (id: string) => {
    await api.delete(`/logs/exercise/${id}`);
    loadSummary();
  };

  const saveNutrition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/logs/nutrition', {
        date,
        meal_name: mealName || undefined,
        calories: parseInt(calories),
        protein_g: parseFloat(protein),
        notes: nutritionNotes,
      });
      showMessage('Nutrition logged!');
      setMealName(''); setCalories(''); setProtein(''); setNutritionNotes('');
      loadSummary();
    } finally {
      setSaving(false);
    }
  };

  const deleteNutrition = async (id: string) => {
    await api.delete(`/logs/nutrition/${id}`);
    loadSummary();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'weight', label: '⚖️ Weight' },
    { key: 'exercise', label: '🏋️ Exercise' },
    { key: 'nutrition', label: '🥗 Nutrition' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Daily Log</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {message && (
        <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm">
          {message}
        </div>
      )}

      {/* Daily totals summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Weight</p>
            <p className="font-bold text-white">
              {summary.weight ? `${kgToLbs(parseFloat(String(summary.weight.weight_kg)))} lbs` : '—'}
            </p>
            {summary.sevenDayAvgWeight && (
              <p className="text-xs text-gray-500">
                7d avg: {kgToLbs(parseFloat(summary.sevenDayAvgWeight))}
              </p>
            )}
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Calories</p>
            <p className="font-bold text-white">{summary.nutritionTotals.calories}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-400">Protein</p>
            <p className="font-bold text-white">{summary.nutritionTotals.protein_g.toFixed(0)}g</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === key
                ? 'bg-gray-700 text-brand-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Weight tab */}
      {tab === 'weight' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-gray-200 mb-4">Log Weight</h2>
          <form onSubmit={saveWeight} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
                required
                placeholder="165.0"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={weightNotes}
                onChange={(e) => setWeightNotes(e.target.value)}
                placeholder="Morning weigh-in, post-workout…"
                className={inputCls}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Weight'}
              </button>
              {summary?.weight && (
                <button
                  type="button"
                  onClick={deleteWeight}
                  className="px-4 py-2 border border-red-800 text-red-400 hover:bg-red-900/30 rounded-lg text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Exercise tab */}
      {tab === 'exercise' && (
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h2 className="font-semibold text-gray-200 mb-4">Log Exercise</h2>
            <form onSubmit={saveExercise} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Exercise Type</label>
                <input
                  type="text"
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value)}
                  required
                  placeholder="Bench Press, Running, Deadlift…"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  min="1"
                  placeholder="45"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={exerciseNotes}
                  onChange={(e) => setExerciseNotes(e.target.value)}
                  placeholder="Sets, reps, feelings…"
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
              >
                {saving ? 'Saving…' : 'Add Exercise'}
              </button>
            </form>
          </div>

          {summary && summary.exercise.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold text-gray-200 mb-3">Today's Exercise</h3>
              <div className="space-y-2">
                {summary.exercise.map((e: ExerciseLog) => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div>
                      <p className="font-medium text-gray-200">{e.exercise_type}</p>
                      <p className="text-xs text-gray-500">{e.duration_minutes} min{e.notes ? ` · ${e.notes}` : ''}</p>
                    </div>
                    <button onClick={() => deleteExercise(e.id)} className="text-red-500 hover:text-red-400 text-sm">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nutrition tab */}
      {tab === 'nutrition' && (
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h2 className="font-semibold text-gray-200 mb-4">Log Nutrition</h2>
            <form onSubmit={saveNutrition} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Meal Name (optional)</label>
                <input
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="Breakfast, Lunch, Post-workout shake…"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Calories</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    required
                    min="0"
                    placeholder="500"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    required
                    min="0"
                    placeholder="40"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={nutritionNotes}
                  onChange={(e) => setNutritionNotes(e.target.value)}
                  placeholder="Chicken breast, rice, broccoli…"
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors"
              >
                {saving ? 'Saving…' : 'Add Meal'}
              </button>
            </form>
          </div>

          {summary && summary.nutrition.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold text-gray-200 mb-3">
                Today's Nutrition
                <span className="ml-2 text-sm font-normal text-gray-500">
                  Total: {summary.nutritionTotals.calories} kcal · {summary.nutritionTotals.protein_g.toFixed(0)}g protein
                </span>
              </h3>
              <div className="space-y-2">
                {summary.nutrition.map((n: NutritionLog) => (
                  <div key={n.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <div>
                      <p className="font-medium text-gray-200">{n.meal_name || 'Entry'}</p>
                      <p className="text-xs text-gray-500">{n.calories} kcal · {n.protein_g}g protein{n.notes ? ` · ${n.notes}` : ''}</p>
                    </div>
                    <button onClick={() => deleteNutrition(n.id)} className="text-red-500 hover:text-red-400 text-sm">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
