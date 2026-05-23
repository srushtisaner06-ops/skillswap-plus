/* ═══════════════════════════════════════════
   Google OAuth Token Verification Service
   ═══════════════════════════════════════════ */

const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');

/**
 * Verify a Google ID token and return the user's profile info.
 * @param {string} credential - The Google ID token from the frontend
 * @returns {{ googleId, email, name, picture }} decoded user info
 */
async function verifyGoogleToken(credential) {
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture
  };
}

module.exports = { verifyGoogleToken };
