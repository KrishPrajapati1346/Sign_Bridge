'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchAdminAnalytics } from '@/lib/admin-api';
import type { AdminAnalyticsStats } from '@signbridge/shared-types';
import { PageHeader } from '@/components/PageHeader';
import { Loader2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export default function AdminAnalyticsPage() {
  const { authFetch } = useAuth();
  const [data, setData] = useState<AdminAnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const stats = await fetchAdminAnalytics(authFetch);
      if (mounted && stats) {
        setData(stats);
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [authFetch]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted">Failed to load analytics.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Admin Dashboard"
        context="Track real-time platform analytics and system health."
      />

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm font-medium text-muted">Total Signs Translated</p>
          <h3 className="mt-2 font-display text-3xl font-semibold text-ink">
            {data.totalSignsTranslated.toLocaleString()}
          </h3>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-muted">Active Video Calls</p>
          <h3 className="mt-2 font-display text-3xl font-semibold text-ink">
            {data.activeVideoCalls.toLocaleString()}
          </h3>
        </div>
        <div className="card p-6">
          <p className="text-sm font-medium text-muted">Total Users</p>
          <h3 className="mt-2 font-display text-3xl font-semibold text-ink">
            {data.newUsers.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-6 font-display text-lg font-semibold text-ink">
            Sign Translation Volume
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.usageData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSigns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f6df6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2f6df6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgb(var(--color-line))"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgb(var(--color-muted))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgb(var(--color-muted))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-line))',
                    borderRadius: '8px',
                    color: 'rgb(var(--color-ink))',
                  }}
                  itemStyle={{ color: 'rgb(var(--color-ink))' }}
                />
                <Area
                  type="monotone"
                  dataKey="signs"
                  stroke="#2f6df6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSigns)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-6 font-display text-lg font-semibold text-ink">
            Daily Active Users & Calls
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgb(var(--color-line))"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgb(var(--color-muted))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgb(var(--color-muted))', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--color-canvas))' }}
                  contentStyle={{
                    backgroundColor: 'rgb(var(--color-surface))',
                    borderColor: 'rgb(var(--color-line))',
                    borderRadius: '8px',
                    color: 'rgb(var(--color-ink))',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar
                  dataKey="users"
                  name="Active Users"
                  fill="#0f9d8a"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="calls"
                  name="Video Calls"
                  fill="#ff5a3c"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
