import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { cmToInches, inchesToCm } from '../utils/units';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary (desk job, no exercise)' },
  { value: 'light', label: 'Light (1-3 days/wk exercise)' },
  { value: 'moderate', label: 'Moderate (3-5 days/wk exercise)' },
  { value: 'active', label: 'Active (6-7 days/wk exercise)' },
  { value: 'very_active', label: 'Very Active (2x/day or physical job)' },
];

const inputCls = 'w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(String(user?.age || ''));
  const [sex, setSex] = useState(user?.sex || '');
  // Display/input in inches; stored in cm
  const [heightInches, setHeightInches] = useState(
    user?.height_cm ? String(cmToInches(parseFloat(String(user.height_cm)))) : ''
  );
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>(user?.activity_level || 'moderate');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/me', {
        name: name || undefined,
        age: age ? parseInt(age) : undefined,
        sex: sex || undefined,
        height_cm: heightInches ? inchesToCm(parseFloat(heightInches)) : undefined,
        activity_level: activityLevel,
      });
      await refreshUser();
      setMessage('Profile updated!');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-white">Profile</h1>

      {message && (
        <div className="bg-green-900/40 border border-green-700 text-green-300 rounded-lg px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <p className="text-sm text-gray-400 mb-4">
          Your profile is used to calculate your TDEE (Total Daily Energy Expenditure) and calorie/protein targets.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-gray-700 border border-gray-600 text-gray-500 rounded-lg px-3 py-2 cursor-not-allowed"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="10"
                max="100"
                placeholder="28"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Biological Sex</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className={inputCls}
              >
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Height (inches)</label>
            <input
              type="number"
              step="0.1"
              value={heightInches}
              onChange={(e) => setHeightInches(e.target.value)}
              placeholder="69"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active')}
              className={inputCls}
            >
              {ACTIVITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
