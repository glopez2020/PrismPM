import { queryOne, execute, uuid, now } from "./turso-http";
import type { Cookie } from "@tanstack/react-start";

// In a real production app, use a proper hashing library like bcrypt.
// For now, we use a simple hash with crypto.subtle.
const SESSION_COOKIE_NAME = "prism_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
}

/**
 * Hash a password using SHA-256 with a salt.
 * NOTE: For production, use bcrypt or Argon2. This is a simplified version.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = uuid().slice(0, 8);
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${salt}:${hashHex}`;
}

/**
 * Verify a password against a stored hash.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === hash;
}

/**
 * Create a new session for a user and return the session token.
 */
export async function createSession(userId: string): Promise<string> {
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS).toISOString();
  await execute(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    [sessionId, userId, expiresAt]
  );
  return sessionId;
}

/**
 * Get a user by session token.
 */
export async function getUserFromSession(sessionId: string): Promise<User | null> {
  const session = await queryOne(
    "SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')",
    [sessionId]
  ) as Session | null;

  if (!session) return null;

  const user = await queryOne(
    "SELECT id, email, display_name, created_at FROM users WHERE id = ?",
    [session.user_id]
  ) as User | null;

  return user;
}

/**
 * Register a new user.
 */
export async function registerUser(email: string, displayName: string, password: string): Promise<{ user: User; sessionId: string } | { error: string }> {
  // Check if user already exists
  const existing = await queryOne("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) {
    return { error: "Email already registered" };
  }

  const userId = uuid();
  const passwordHash = await hashPassword(password);
  const createdAt = now();

  await execute(
    "INSERT INTO users (id, email, display_name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, email, displayName, passwordHash, createdAt, createdAt]
  );

  const sessionId = await createSession(userId);
  const user: User = { id: userId, email, display_name: displayName, created_at: createdAt };
  return { user, sessionId };
}

/**
 * Login a user.
 */
export async function loginUser(email: string, password: string): Promise<{ user: User; sessionId: string } | { error: string }> {
  const row = await queryOne(
    "SELECT id, email, display_name, password_hash, created_at FROM users WHERE email = ?",
    [email]
  ) as (User & { password_hash: string }) | null;

  if (!row) {
    return { error: "Invalid email or password" };
  }

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) {
    return { error: "Invalid email or password" };
  }

  const sessionId = await createSession(row.id);
  const user: User = { id: row.id, email: row.email, display_name: row.display_name, created_at: row.created_at };
  return { user, sessionId };
}

/**
 * Logout - delete a session.
 */
export async function logoutUser(sessionId: string): Promise<void> {
  await execute("DELETE FROM sessions WHERE id = ?", [sessionId]);
}

/**
 * Get the session cookie settings.
 */
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  };
}

export { SESSION_COOKIE_NAME };