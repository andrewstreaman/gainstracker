import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { ChallengeDetail, ChallengeMember, WeightLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { kgToLbs } from '../utils/units';

const CHART_COLORS = {
  grid: '#374151',
  tick: '#9ca3af',
  tooltip: { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f3f4f6' },
  tooltipLabel: { color: '#9ca3af' },
};

function AdherenceBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-brand-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-400 w-10 text-right">{value}%</span>
    </div>
  );
}

function MemberCard({
  member, rank, isCurrentUser, onViewChart,
}: {
  member: ChallengeMember;
  rank: number;
  isCurrentUser: boolean;
  onViewChart: (m: ChallengeMember) => void;
}) {
  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  return (
    <div className={`border rounded-xl p-4 ${isCurrentUser ? 'bg-brand-900/30 border-brand-700' : 'bg-gray-800 border-gray-700'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{rankEmoji}</span>
          <div>
            <p className="font-semibold text-gray-100">
              {member.name}
              {isCurrentUser && <span className="ml-2 text-xs text-brand-400">(you)</span>}
            </p>
            {member.goal && (
              <p className="text-xs text-gray-500">
                Goal: {kgToLbs(member.goal.start_weight_kg)} → {kgToLbs(member.goal.target_weight_kg)} lbs
                by {format(new Date(member.goal.target_date), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        </div>
        <button onClick={() => onViewChart(member)} className="text-xs text-brand-400 hover:underline">
          View chart
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-sm mb-3">
        <div>
          <p className="text-gray-500 text-xs">Current</p>
          <p className="font-bold text-gray-100">
            {member.current_weight ? `${kgToLbs(member.current_weight)} lbs` : '—'}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Streak</p>
          <p className="font-bold text-gray-100">🔥 {member.streak}d</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Goal %</p>
          <p className="font-bold text-gray-100">{member.goalProgress !== null ? `${member.goalProgress}%` : '—'}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1">Adherence (days logged)</p>
        <AdherenceBar value={member.adherence} />
      </div>
    </div>
  );
}

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartMember, setChartMember] = useState<ChallengeMember | null>(null);
  const [chartData, setChartData] = useState<{ date: string; weight: number }[]>([]);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<ChallengeDetail>(`/challenges/${id}`)
      .then((r) => setDetail(r.data))
      .catch(() => navigate('/challenges'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleViewChart = async (member: ChallengeMember) => {
    setChartMember(member);
    const r = await api.get<WeightLog[]>(`/challenges/${id}/members/${member.id}/weights`);
    setChartData(r.data.map((l) => ({
      date: format(new Date(l.date), 'MMM d'),
      weight: kgToLbs(parseFloat(String(l.weight_kg))),
    })));
  };

  const handleLeave = async () => {
    if (!confirm('Leave this challenge?')) return;
    setLeaving(true);
    await api.delete(`/challenges/${id}/leave`);
    navigate('/challenges');
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading…</div>;
  if (!detail) return null;

  const { challenge, members } = detail;

  const copyCode = async () => {
    await navigator.clipboard.writeText(challenge.invite_code);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/challenges')} className="text-sm text-gray-500 hover:text-gray-300 mb-2">
            ← Back to Challenges
          </button>
          <h1 className="text-2xl font-bold text-white">{challenge.name}</h1>
          {challenge.description && <p className="text-gray-400 text-sm mt-1">{challenge.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>Started {format(new Date(challenge.start_date), 'MMM d, yyyy')}</span>
            {challenge.end_date && <span>· Ends {format(new Date(challenge.end_date), 'MMM d, yyyy')}</span>}
            <span>· {members.length} member{members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Invite code:</span>
            <button
              onClick={copyCode}
              className="font-mono text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-lg transition-colors"
              title="Click to copy"
            >
              {challenge.invite_code}
            </button>
          </div>
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="text-xs text-red-500 hover:text-red-400"
          >
            Leave challenge
          </button>
        </div>
      </div>

      {chartMember && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-200">{chartMember.name}'s Weight Chart</h2>
            <button onClick={() => setChartMember(null)} className="text-gray-500 hover:text-gray-300">✕</button>
          </div>
          {chartData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No weight data logged yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: CHART_COLORS.tick }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: CHART_COLORS.tick }} unit=" lbs" />
                <Tooltip contentStyle={CHART_COLORS.tooltip} labelStyle={CHART_COLORS.tooltipLabel} formatter={(v: number) => [`${v} lbs`]} />
                <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Weight" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-200 mb-3">Leaderboard</h2>
        <p className="text-xs text-gray-500 mb-4">
          Ranked by logging adherence — % of days since challenge start with weight or nutrition logged.
          Everyone competes fairly against their own goal.
        </p>
        <div className="space-y-3">
          {members.map((member, i) => (
            <MemberCard
              key={member.id}
              member={member}
              rank={i + 1}
              isCurrentUser={member.id === user?.id}
              onViewChart={handleViewChart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
