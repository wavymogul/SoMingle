// Shared request-validation helpers used by the API routes.

export const isEmail = (v: unknown): boolean =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

export const strArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

// Coerce to an integer clamped to a 1-10 scale (defaults to the midpoint).
export const clampScale = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(1, Math.round(n)));
};
