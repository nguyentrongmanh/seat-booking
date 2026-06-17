'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Seat, api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  seat: Seat;
  onReserved: () => void;
}

export default function SeatCard({ seat, onReserved }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReserve = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const reservation = await api.reservations.create(seat.id);
      router.push(`/payment/${reservation.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reserve seat';
      setError(msg);
      onReserved();
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = seat.isAvailable ? 'Available' : seat.reservation?.status === 'confirmed' ? 'Taken' : 'Reserved';
  const statusColor = seat.isAvailable
    ? 'bg-green-100 text-green-700'
    : seat.reservation?.status === 'confirmed'
    ? 'bg-red-100 text-red-700'
    : 'bg-yellow-100 text-yellow-700';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Seat</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{seat.label}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {!seat.isAvailable && seat.reservation?.userEmail && (
        <p className="text-xs text-gray-500">Reserved by {seat.reservation.userEmail}</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        onClick={handleReserve}
        disabled={!seat.isAvailable || loading}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          seat.isAvailable
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? 'Reserving…' : seat.isAvailable ? 'Reserve Seat' : 'Unavailable'}
      </button>
    </div>
  );
}
