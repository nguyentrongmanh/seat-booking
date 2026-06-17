'use client';
import { useEffect, useState, useCallback } from 'react';
import { api, Seat } from '../lib/api';
import SeatCard from '../components/SeatCard';

export default function HomePage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSeats = useCallback(async () => {
    try {
      const data = await api.seats.list();
      setSeats(data);
    } catch {
      setError('Failed to load seats. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSeats();
  }, [loadSeats]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Seats</h1>
        <p className="mt-2 text-gray-500">Select a seat to reserve. Payment is processed immediately.</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-44 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {seats.map((seat) => (
            <SeatCard key={seat.id} seat={seat} onReserved={loadSeats} />
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
        <strong>Test cards:</strong> Any card number works except those ending in{' '}
        <code className="bg-blue-100 px-1 rounded">0000</code> (those simulate payment failure).
      </div>
    </div>
  );
}
