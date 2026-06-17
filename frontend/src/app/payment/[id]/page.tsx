'use client';
import { useEffect, useState, FormEvent, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Reservation } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

function formatCard(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [secs, setSecs] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (secs <= 0) return;
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [secs]);

  const mins = Math.floor(secs / 60);
  const remaining = secs % 60;
  const urgent = secs < 120;

  return (
    <span className={urgent ? 'text-red-600 font-semibold' : 'text-yellow-700 font-semibold'}>
      {secs === 0 ? 'Expired' : `${mins}:${String(remaining).padStart(2, '0')} remaining`}
    </span>
  );
}

type PageState = 'loading' | 'form' | 'processing' | 'confirmed' | 'failed' | 'expired' | 'error';

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [error, setError] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [payError, setPayError] = useState('');

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const loadReservation = useCallback(async () => {
    try {
      const res = await api.reservations.getById(id);
      setReservation(res);
      if (res.status === 'confirmed') { stopPolling(); setPageState('confirmed'); }
      else if (res.status === 'cancelled') { stopPolling(); setPageState('failed'); }
      else if (res.status === 'pending') setPageState('form');
    } catch {
      setError('Reservation not found.');
      setPageState('error');
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadReservation();
  }, [user, loadReservation]);

  useEffect(() => () => stopPolling(), []);

  const startPolling = () => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.reservations.getById(id);
        setReservation(res);
        if (res.status === 'confirmed') { stopPolling(); setPageState('confirmed'); }
        else if (res.status === 'cancelled') { stopPolling(); setPageState('failed'); }
      } catch {
        stopPolling();
      }
    }, 1000);
  };

  const handlePay = async (e: FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPageState('processing');

    try {
      await api.payments.initiate(id, { cardNumber, expiry, cvv, cardholderName });
      startPolling();
    } catch (err: unknown) {
      setPayError(err instanceof Error ? err.message : 'Payment failed');
      setPageState('form');
    }
  };

  if (authLoading || pageState === 'loading') return null;

  if (pageState === 'error') {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/" className="text-blue-600 hover:underline text-sm">Back to seats</Link>
      </div>
    );
  }

  if (pageState === 'confirmed') {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Reservation Confirmed!</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your seat <strong>{reservation?.seat?.label}</strong> has been reserved successfully.
          </p>
          {reservation?.payment?.transactionId && (
            <p className="text-xs text-gray-400 mb-6">
              Transaction ID:{' '}
              <code className="bg-gray-100 px-1 rounded">{reservation.payment.transactionId}</code>
            </p>
          )}
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to seats
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === 'failed') {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Failed</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your card was declined. The reservation has been cancelled.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Try again
          </Link>
        </div>
      </div>
    );
  }

  if (pageState === 'processing') {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Processing Payment…</h2>
          <p className="text-sm text-gray-500">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  const isStale = reservation && reservation.status !== 'pending';

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete Payment</h1>
          <div className="text-sm text-gray-500 space-y-1">
            <p>
              Seat: <strong className="text-gray-900">{reservation?.seat?.label ?? '—'}</strong>
            </p>
            <p>
              Amount: <strong className="text-gray-900">$50.00</strong>
            </p>
            {reservation?.status === 'pending' && (
              <p>
                Expires in: <ExpiryCountdown expiresAt={reservation.expiresAt} />
              </p>
            )}
          </div>
        </div>

        {isStale ? (
          <div className="text-center">
            <p className="text-red-600 text-sm mb-4">
              This reservation has already been {reservation?.status}. Please select a new seat.
            </p>
            <Link href="/" className="text-blue-600 hover:underline text-sm">Back to seats</Link>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
              <input
                type="text"
                required
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCard(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                <input
                  type="text"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input
                  type="text"
                  required
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {payError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                {payError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Pay $50.00
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
