import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../services/api';
import { Challenge } from '../types';

const inputCls = 'w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const load = () => {
    api.get<Challenge[]>('/challenges').then((r) => setChallenges(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/challenges', { name, description, start_date: startDate, end_date: endDate || undefined });
      setMessage('Challenge created!');
      setShowCreate(false);
      setName(''); setDescription(''); setEndDate('');
      load();
    } catch {
      setError('Failed to create challenge');
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post('/challenges/join', { invite_code: inviteCode });
      setMessage('Joined challenge!');
      setShowJoin(false);
      setInviteCode('');
      load();
    } catch {
      setError('Challenge not found. Check the invite code.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Group Challenges</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); }}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Join
          </button>
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); }}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Create
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm">{message}</div>
      )}
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {showCreate && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-gray-200 mb-4">Create Challenge</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Challenge Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Summer Cut 2025" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Let's all hit our goals together!" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Date (optional)</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors">
                {saving ? 'Creating…' : 'Create Challenge'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-600 text-gray-400 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showJoin && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-gray-200 mb-4">Join Challenge</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                placeholder="ABC123"
                maxLength={10}
                className={`${inputCls} font-mono`}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2 transition-colors">
                {saving ? 'Joining…' : 'Join Challenge'}
              </button>
              <button type="button" onClick={() => setShowJoin(false)} className="px-4 py-2 border border-gray-600 text-gray-400 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {challenges.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">🏆</p>
          <p className="font-medium">No challenges yet.</p>
          <p className="text-sm">Create one or join a friend's challenge.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <Link
              key={c.id}
              to={`/challenges/${c.id}`}
              className="block bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-brand-600 hover:bg-gray-750 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-100">{c.name}</h3>
                  {c.description && <p className="text-sm text-gray-400 mt-0.5">{c.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>Started {format(new Date(c.start_date), 'MMM d, yyyy')}</span>
                    {c.end_date && <span>· Ends {format(new Date(c.end_date), 'MMM d, yyyy')}</span>}
                    <span>· {c.member_count} member{Number(c.member_count) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <span className="font-mono text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                  {c.invite_code}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
