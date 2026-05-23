import api from './api.js';

export async function createBooking(sessionId) {
  const res = await api.post('/bookings', { sessionId });
  if (res.error) throw new Error(res.message);
  return res.data?.data?.booking || null;
}

export async function getMyBookings() {
  const res = await api.get('/bookings/me');
  if (res.error) return { learning: [], mentoring: [] };
  return res.data?.data || { learning: [], mentoring: [] };
}

export async function getBookingById(id) {
  const res = await api.get(`/bookings/${id}`);
  if (res.error) return null;
  return res.data?.data?.booking || null;
}

export async function acceptBooking(id) {
  const res = await api.patch(`/bookings/${id}/accept`, {});
  if (res.error) throw new Error(res.message);
  return res.data?.data?.booking || null;
}

export async function rejectBooking(id) {
  const res = await api.patch(`/bookings/${id}/reject`, {});
  if (res.error) throw new Error(res.message);
  return res.data?.data?.booking || null;
}

export async function completeBooking(id) {
  const res = await api.patch(`/bookings/${id}/complete`, {});
  if (res.error) throw new Error(res.message);
  return res.data?.data?.booking || null;
}

export async function cancelBooking(id) {
  const res = await api.patch(`/bookings/${id}/cancel`, {});
  if (res.error) throw new Error(res.message);
  return res.data?.data?.booking || null;
}
