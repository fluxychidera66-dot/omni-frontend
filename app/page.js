'use client';

import { useEffect, useState } from 'react';
import UsageChart from '../components/UsageChart';
import ProviderStats from '../components/ProviderStats';
import ApiKeyManager from '../components/ApiKeyManager';
import TaskBreakdown from '../components/TaskBreakdown';
import BillingPanel from '../components/BillingPanel';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://your-backend.vercel.app';

export default function Dashboard() {
  const [apiKey, setApiKey]       = useState('');
  const [inputKey, setInputKey]   = useState('');
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [email, setEmail]         = useState('');
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError]   = useState('');
  const [view, setView]           = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'billing'

  useEffect(() => {
    const storedKey = localStorage.getItem('omni_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      fetchUsage(storedKey);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUsage = async (key) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/dashboard/usage`, {
        headers: { 'x-api-key': key },
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setUsageData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (!inputKey.trim()) return;
    localStorage.setItem('omni_api_key', inputKey.trim());
    setApiKey(inputKey.trim());
    fetchUsage(inputKey.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('omni_api_key');
    setApiKey('');
    setUsageData(null);
  };

  const handleRegenerate = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/regenerate-key`, {
        method: 'POST',
        headers: { 'x-api-key': apiKey },
      });
      if (!res.ok) throw new Error('Failed to regenerate');
      const data = await res.json();
      localStorage.setItem('omni_api_key', data.apiKey);
      setApiKey(data.apiKey);
      alert(`New API key: ${data.apiKey}`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRegister = async () => {
    if (!email.trim()) return;
    setRegistering(true);
    setRegError('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register?email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Registration failed');
      }
      const data = await res.json();
      localStorage.setItem('omni_api_key', data.apiKey);
      setApiKey(data.apiKey);
      setView('dashboard');
      fetchUsage(data.apiKey);
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  // --- Register view ---
  if (view === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-card p-8 rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6">Create Omni Account</h1>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-800 px-4 py-2 rounded mb-3 outline-none focus:ring-1 focus:ring-accent"
          />
          {regError && <p className="text-red-500 text-sm mb-3">{regError}</p>}
          <button
            onClick={handleRegister}
            disabled={registering}
            className="w-full bg-accent hover:bg-blue-700 py-2 rounded font-semibold disabled:opacity-50"
          >
            {registering ? 'Registering...' : 'Register & Get API Key'}
          </button>
          <button
            onClick={() => setView('dashboard')}
            className="w-full mt-3 text-gray-400 hover:text-white text-sm"
          >
            Already have a key? Sign in
          </button>
        </div>
      </div>
    );
  }

  // --- No key ---
  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-card p-8 rounded-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2">Omni Dashboard</h1>
          <p className="text-gray-400 mb-6 text-sm">Enter your API key to view your usage.</p>
          <input
            type="text"
            placeholder="omni_..."
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-gray-800 px-4 py-2 rounded mb-3 outline-none focus:ring-1 focus:ring-accent font-mono text-sm"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-accent hover:bg-blue-700 py-2 rounded font-semibold"
          >
            View Dashboard
          </button>
          <button
            onClick={() => setView('register')}
            className="w-full mt-3 text-gray-400 hover:text-white text-sm"
          >
            No account? Register free
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Omni Dashboard</h1>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm">Sign out</button>
          </div>
          <div className="bg-red-900/30 border border-red-700 text-red-400 p-4 rounded-lg">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Omni Dashboard</h1>
          <div className="flex items-center gap-4">
            {/* Balance badge */}
            {usageData?.currentBalance !== undefined && (
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer
                  ${usageData.currentBalance < 2
                    ? 'bg-red-900/40 text-red-400 border border-red-700'
                    : 'bg-green-900/40 text-green-400 border border-green-700'
                  }`}
                onClick={() => setActiveTab('billing')}
              >
                ${usageData.currentBalance.toFixed(2)} credits
              </div>
            )}
            <button onClick={() => fetchUsage(apiKey)} className="text-gray-400 hover:text-white text-sm">
              Refresh
            </button>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm">
              Sign out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 text-sm font-medium ${activeTab === 'overview'
              ? 'border-b-2 border-accent text-white'
              : 'text-gray-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-2 text-sm font-medium ${activeTab === 'billing'
              ? 'border-b-2 border-accent text-white'
              : 'text-gray-400 hover:text-white'}`}
          >
            Billing
            {usageData?.currentBalance < 2 && (
              <span className="ml-1 text-red-400">⚠</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 text-sm font-medium ${activeTab === 'settings'
              ? 'border-b-2 border-accent text-white'
              : 'text-gray-400 hover:text-white'}`}
          >
            API Key
          </button>
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-card p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Total API Calls</div>
                <div className="text-2xl font-bold">{usageData?.totalCalls ?? 0}</div>
                <div className="text-xs text-gray-500 mt-1">last 30 days</div>
              </div>
              <div className="bg-card p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Total Spent</div>
                <div className="text-2xl font-bold">${(usageData?.totalSpent ?? 0).toFixed(4)}</div>
                <div className="text-xs text-gray-500 mt-1">last 30 days</div>
              </div>
              <div className="bg-card p-4 rounded-lg">
                <div className="text-gray-400 text-sm">Failed Requests</div>
                <div className="text-2xl font-bold">{usageData?.failedRequests ?? 0}</div>
                <div className="text-xs text-gray-500 mt-1">{usageData?.failureRate ?? 0}% failure rate</div>
              </div>
              <div className="bg-card p-4 rounded-lg border border-gray-800">
                <div className="text-gray-400 text-sm">Credit Balance</div>
                <div className="text-2xl font-bold text-green-400">
                  ${(usageData?.currentBalance ?? 0).toFixed(4)}
                </div>
                <a href="/billing" className="text-xs text-accent hover:underline mt-1 block">
                  Top up →
                </a>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-card p-4 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-2">Requests & Cost Over Time (30 days)</h2>
              <UsageChart data={usageData?.dailyUsage || []} />
            </div>

            {/* Provider + Task breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProviderStats
                costPerProvider={usageData?.costPerProvider || {}}
                callsPerProvider={usageData?.callsPerProvider || {}}
                avgLatencyPerProvider={usageData?.avgLatencyPerProvider || {}}
              />
              <TaskBreakdown taskBreakdown={usageData?.taskBreakdown || {}} />
            </div>
          </>
        )}

        {/* Billing tab */}
        {activeTab === 'billing' && (
          <BillingPanel
            apiKey={apiKey}
            currentBalance={usageData?.currentBalance ?? 0}
            onBalanceUpdate={() => fetchUsage(apiKey)}
          />
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <ApiKeyManager apiKey={apiKey} onRegenerate={handleRegenerate} />
        )}

      </div>
    </div>
  );
}
