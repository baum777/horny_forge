import crypto from 'crypto';

const SECRET = process.env.SHARE_TOKEN_SECRET;
const TTL_SECONDS = 5 * 60;

type SharePayload = {
  actor_user_id: string;
  subject_id?: string;
  exp: number;
};

function getSecret(): string {
  if (!SECRET) {
    throw new Error('SHARE_TOKEN_SECRET not configured');
  }
  return SECRET;
}

export function signShareToken(input: { actor_user_id: string; subject_id?: string }) {
  const payload: SharePayload = {
    actor_user_id: input.actor_user_id,
    subject_id: input.subject_id,
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };

  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySignedShareToken(token: string): SharePayload | null {
  try {
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SharePayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
