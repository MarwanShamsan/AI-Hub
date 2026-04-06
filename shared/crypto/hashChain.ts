import crypto from "node:crypto";

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj).sort()) out[k] = sortDeep(obj[k]);
    return out;
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * hash = sha256(prev_hash + canonical_json(event_without_hash))
 * prev_hash null => empty string
 */
export function computeEventHash(prevHash: string | null, eventWithoutHash: unknown): string {
  const prefix = prevHash ?? "";
  return sha256Hex(prefix + canonicalJson(eventWithoutHash));
}
