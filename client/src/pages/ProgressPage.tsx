import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { format, parseISO, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import api from '../services/api';
import { WeightLog, WeightGoal, GoalSuggestions, NutritionLog } from '../types';
import { kgToLbs } from '../utils/units';

interface GoalResponse {
  goal: WeightGoal;
  suggestions: GoalSuggestions | null;
}

const CHART_COLORS = {
  grid: '#374151',
  tick: '#9ca3af',
  tooltip: { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' },
  tooltipLabel: { color: '#9ca3af' },
};

function buildGoalTrendline(goal: WeightGoal, logs: WeightLog[]) {
  if (!logs.length) return [];
  const startDate = new Date(goal.start_date);
  const totalDays = (new Date(goal.target_date).getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
  const dailyChangeKg = (parseFloat(String(goal.target_weight_kg)) - parseFloat(String(goal.start_weight_kg))) / totalDays;
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  return sortedLogs.map((log, i) => {
    const d = log.date.split('T')[0];
    const dayOffset = (new Date(d).getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    const goalKg = parseFloat(String(goal.start_weight_kg)) + dailyChangeKg * dayOffset;
    const window = sortedLogs.slice(Math.max(0, i - 6), i + 1);
    const avgKg = window.reduce((s, l) => s + parseFloat(String(l.weight_kg)), 0) / window.length;
    return {
      date: format(parseISO(d), 'MMM d'),
      weight: kgToLbs(parseFloat(String(log.weight_kg))),
      rollingAvg: kgToLbs(parseFloat(avgKg.toFixed(2))),
      goalLine: kgToLbs(parseFloat(goalKg.toFixed(2))),
    };
  });
}

export default function ProgressPage() {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [goalData, setGoalData] = useState<GoalResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<WeightLog[]>('/logs/weight'),
      api.get<NutritionLog[]>('/logs/nutrition', { params: { from: '2024-01-01' } }),
      api.get<GoalResponse | null>('/goals/active'),
    ]).then(([w, n, g]) => {
      setWeightLogs(w.data);
      setNutritionLogs(n.data);
      setGoalData(g.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 text-sm">Loading…</div>;

  const weightChartData = goalData?.goal
    ? buildGoalTrendline(goalData.goal, weightLogs)
    : weightLogs.sort((a, b) => a.date.localeCompare(b.date)).map((l) => ({
        date: format(parseISO(l.date.split('T')[0]), 'MMM d'),
        weight: kgToLbs(parseFloat(String(l.weight_kg))),
      }));

  // Nutrition daily totals (last 30 days)
  const nutritionByDate = new Map<string, { calories: number; protein: number }>();
  nutritionLogs.forEach((n) => {
    const d = n.date.split('T')[0];
    const ex = nutritionByDate.get(d) || { calories: 0, protein: 0 };
    nutritionByDate.set(d, {
      calories: ex.calories + n.calories,
      protein: ex.protein + parseFloat(String(n.protein_g)),
    });
  });

  const nutritionChartData = Array.from(nutritionByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, data]) => ({
      date: format(parseISO(date), 'MMM d'),
      calories: data.calories,
      protein: Math.round(data.protein),
      targetCalories: goalData?.suggestions?.targetCalories,
      targetProtein: goalData?.suggestions?.targetProtein,
    }));

  // Weekly weight change summary
  const weeklyData: { week: string; actual: number; target: number }[] = [];
  if (goalData?.goal && weightLogs.length >= 2) {
    const sorted = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date));
    const earliest = new Date(sorted[0].date.split('T')[0]);
    const latest = new Date(sorted[sorted.length - 1].date.split('T')[0]);
    const weeks = eachWeekOfInterval({ start: earliest, end: latest }, { weekStartsOn: 1 });
    weeks.slice(-8).forEach((weekStart) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const wl = sorted.filter((l) => {
        const d = new Date(l.date.split('T')[0]);
        return d >= weekStart && d <= weekEnd;
      });
      if (wl.length >= 2) {
        const actualKg = parseFloat(String(wl[wl.length - 1].weight_kg)) - parseFloat(String(wl[0].weight_kg));
        weeklyData.push({
          week: format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d'),
          actual: parseFloat(kgToLbs(actualKg).toFixed(1)),
          target: goalData.suggestions ? parseFloat(kgToLbs(goalData.suggestions.weeklyWeightChange).toFixed(1)) : 0,
        });
      }
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Progress</h1>

      {/* Weight chart */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h2 className="font-semibold text-gray-200 mb-4">Weight Over Time</h2>
        {weightChartData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No weight logs yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weightChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_COLORS.tick }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: CHART_COLORS.tick }} unit=" lbs" />
              <Tooltip contentStyle={CHART_COLORS.tooltip} labelStyle={CHART_COLORS.tooltipLabel} formatter={(v: number) => [`${v} lbs`]} />
              <Legend wrapperStyle={{ color: CHART_COLORS.tick }} />
              <Line type="monotone" dataKey="weight" stroke="#6b7280" strokeWidth={1.5} dot={{ r: 2 }} name="Daily Weight" />
              <Line type="monotone" dataKey="rollingAvg" stroke="#22c55e" strokeWidth={2.5} dot={false} name="7-Day Avg" />
              {goalData?.goal && (
                <Line type="monotone" dataKey="goalLine" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Goal Trendline" />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly summary */}
      {weeklyData.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-gray-200 mb-4">Weekly Weight Change (Actual vs Target)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: CHART_COLORS.tick }} />
              <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.tick }} unit=" lbs" />
              <Tooltip contentStyle={CHART_COLORS.tooltip} labelStyle={CHART_COLORS.tooltipLabel} formatter={(v: number) => [`${v} lbs`]} />
              <Legend wrapperStyle={{ color: CHART_COLORS.tick }} />
              <ReferenceLine y={0} stroke="#6b7280" />
              <Bar dataKey="actual" fill="#22c55e" name="Actual Change" radius={[4, 4, 0, 0]} />
              {goalData?.suggestions && (
                <ReferenceLine
                  y={parseFloat(kgToLbs(goalData.suggestions.weeklyWeightChange).toFixed(1))}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: 'Target', position: 'right', fontSize: 11, fill: '#f59e0b' }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Nutrition chart */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h2 className="font-semibold text-gray-200 mb-4">Calorie & Protein Adherence (Last 30 Days)</h2>
        {nutritionChartData.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No nutrition logs yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={nutritionChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: CHART_COLORS.tick }} />
              <YAxis yAxisId="cal" orientation="left" tick={{ fontSize: 11, fill: CHART_COLORS.tick }} />
              <YAxis yAxisId="prot" orientation="right" tick={{ fontSize: 11, fill: CHART_COLORS.tick }} unit="g" />
              <Tooltip contentStyle={CHART_COLORS.tooltip} labelStyle={CHART_COLORS.tooltipLabel} />
              <Legend wrapperStyle={{ color: CHART_COLORS.tick }} />
              <Bar yAxisId="cal" dataKey="calories" fill="#60a5fa" name="Calories" radius={[3, 3, 0, 0]} />
              {goalData?.suggestions && (
                <ReferenceLine yAxisId="cal" y={goalData.suggestions.targetCalories} stroke="#2563eb" strokeDasharray="4 4" label={{ value: 'Cal Target', position: 'right', fontSize: 10, fill: '#60a5fa' }} />
              )}
              <Bar yAxisId="prot" dataKey="protein" fill="#34d399" name="Protein (g)" radius={[3, 3, 0, 0]} />
              {goalData?.suggestions && (
                <ReferenceLine yAxisId="prot" y={goalData.suggestions.targetProtein} stroke="#059669" strokeDasharray="4 4" label={{ value: 'Prot Target', position: 'right', fontSize: 10, fill: '#34d399' }} />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
