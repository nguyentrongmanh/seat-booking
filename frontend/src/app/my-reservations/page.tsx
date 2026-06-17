'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Reservation } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function MyReservationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.reservations.listMine();
      setReservations(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (authLoading || loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Reservations</h1>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-3">No reservations yet.</p>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Browse available seats
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900">{r.seat?.label ?? 'Seat'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(r.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {r.payment && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    ${Number(r.payment.amount).toFixed(2)}{' '}
                    {r.payment.transactionId && (
                      <span className="text-gray-400">· {r.payment.transactionId}</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    statusColors[r.status] ?? 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
                {r.status === 'pending' && (
                  <Link
                    href={`/payment/${r.id}`}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 font-medium"
                  >
                    Pay now
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
