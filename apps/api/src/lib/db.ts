// Thin typed helpers over D1.
import type { Env } from "../types";

export function db(env: Env): D1Database {
  return env.DB;
}

export async function first<T>(
  env: Env,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  const stmt = env.DB.prepare(sql).bind(...params);
  return (await stmt.first<T>()) ?? null;
}

export async function all<T>(
  env: Env,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const stmt = env.DB.prepare(sql).bind(...params);
  const res = await stmt.all<T>();
  return res.results ?? [];
}

export async function run(
  env: Env,
  sql: string,
  ...params: unknown[]
): Promise<D1Result> {
  return env.DB.prepare(sql).bind(...params).run();
}

// Simple id generator (crypto UUID, prefixed for readability).
export function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
