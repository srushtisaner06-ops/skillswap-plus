function generateMeetingUrl(bookingId) {
  const baseUrl = (process.env.JITSI_BASE_URL || 'https://meet.jit.si').replace(/\/+$/, '');
  const roomPrefix = (process.env.JITSI_ROOM_PREFIX || 'skillswap').replace(/[^a-zA-Z0-9-]/g, '');
  const roomId = `${roomPrefix}-${String(bookingId)}`;
  return `${baseUrl}/${encodeURIComponent(roomId)}`;
}

module.exports = { generateMeetingUrl };
