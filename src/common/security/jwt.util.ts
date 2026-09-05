import { createHmac, timingSafeEqual } from 'crypto';

export type JwtPayload = {
  sub: string;
  phone: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

export function signJwt(
  payload: JwtPayload,
  secret: string,
  expiresInSeconds = 60 * 60 * 24,
): string {
  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = base64Url(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds }),
  );
  const signature = signatureFor(`${encodedHeader}.${encodedPayload}`, secret);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid token');
  }

  const expectedSignature = signatureFor(
    `${encodedHeader}.${encodedPayload}`,
    secret,
  );
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, 'base64url').toString('utf8'),
  ) as JwtPayload;
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Expired token');
  }
  return payload;
}

function signatureFor(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

function base64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}
