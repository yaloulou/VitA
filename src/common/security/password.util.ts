import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

const iterations = 120_000;
const keyLength = 32;
const digest = 'sha256';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url');
  const hash = pbkdf2Sync(
    password,
    salt,
    iterations,
    keyLength,
    digest,
  ).toString('base64url');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash) return false;

  const [scheme, iterationsValue, salt, expectedHash] = storedHash.split('$');
  if (scheme !== 'pbkdf2' || !iterationsValue || !salt || !expectedHash) {
    return false;
  }

  const computed = pbkdf2Sync(
    password,
    salt,
    Number(iterationsValue),
    keyLength,
    digest,
  ).toString('base64url');

  const expected = Buffer.from(expectedHash);
  const actual = Buffer.from(computed);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
