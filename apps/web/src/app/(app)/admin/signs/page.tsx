'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchAdminSigns, retrainModels } from '@/lib/admin-api';
import type { AdminSignSample } from '@signbridge/shared-types';
import { PageHeader } from '@/components/PageHeader';
import { Loader2, CheckCircle2, FileVideo } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminSignsPage() {
  const { authFetch } = useAuth();
  const [signs, setSigns] = useState<AdminSignSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const data = await fetchAdminSigns(authFetch);
      if (mounted && data) {
        setSigns(data);
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [authFetch]);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainSuccess(null);
    try {
      const msg = await retrainModels(authFetch);
      setRetrainSuccess(msg);
      setTimeout(() => setRetrainSuccess(null), 5000);
    } catch {
      alert('Retraining failed. Please try again.');
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Community Sign Contributions"
        context="Review signs submitted by the community and trigger ML model retraining."
      >
        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="btn-primary inline-flex items-center gap-2"
        >
          {retraining ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          {retraining ? 'Retraining Models...' : 'Retrain ML Model'}
        </button>
      </PageHeader>

      {retrainSuccess && (
        <div className="mb-6 rounded-xl bg-teal-50 p-4 text-teal-800 border border-teal-200">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-5 w-5" />
            {retrainSuccess}
          </p>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
        <table className="w-full text-left text-sm text-ink">
          <thead className="bg-canvas text-muted">
            <tr>
              <th className="px-6 py-4 font-semibold">Sign Label</th>
              <th className="px-6 py-4 font-semibold">Submitted By</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {signs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted">
                  No community signs submitted yet.
                </td>
              </tr>
            ) : (
              signs.map((sign) => (
                <tr key={sign.id} className="transition-colors hover:bg-canvas">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-medium text-ink">
                      <FileVideo className="h-4 w-4 text-muted" />
                      {sign.label}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {sign.user.name || 'Anonymous'}{' '}
                    <span className="text-muted block text-xs">{sign.user.email}</span>
                  </td>
                  <td className="px-6 py-4 text-muted whitespace-nowrap">
                    {formatDistanceToNow(new Date(sign.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">
                      Pending Review
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
