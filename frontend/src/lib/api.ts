const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(body.message || 'Request failed');
  }

  const body = await res.json() as { data: T };
  return body.data;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface SeatReservation {
  id: string;
  status: string;
  expiresAt: string;
  userEmail?: string;
}

export interface Seat {
  id: string;
  number: number;
  label: string;
  isAvailable: boolean;
  reservation: SeatReservation | null;
}

export interface Reservation {
  id: string;
  seatId: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  seat?: { id: string; number: number; label: string };
  payment?: { id: string; status: string; amount: number; transactionId?: string };
}

export interface InitiatePaymentResult {
  status: 'processing';
  reservationId: string;
  paymentId: string;
}

export const api = {
  auth: {
    register: (data: { email: string; name: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>('/auth/me'),
  },
  seats: {
    list: () => request<Seat[]>('/seats'),
  },
  reservations: {
    create: (seatId: string) =>
      request<Reservation>('/reservations', {
        method: 'POST',
        body: JSON.stringify({ seatId }),
      }),
    getById: (id: string) => request<Reservation>(`/reservations/${id}`),
    listMine: () => request<Reservation[]>('/reservations/my'),
  },
  payments: {
    initiate: (
      reservationId: string,
      data: { cardNumber: string; expiry: string; cvv: string; cardholderName: string },
    ) =>
      request<InitiatePaymentResult>(`/payments/initiate/${reservationId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
