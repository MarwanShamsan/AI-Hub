import { AuthorityMatrix, Catalog, NewCommand, PolicyReject, StoredEvent } from "../events/types";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function validateCommand(
  catalog: Catalog,
  matrix: AuthorityMatrix,
  cmd: NewCommand,
  history: Pick<StoredEvent, "event_type" | "payload" | "created_at">[]
): PolicyReject | null {

  const def = catalog.events[cmd.event_type];
  if (!def) {
    return { code: "UNKNOWN_EVENT_TYPE", message: `event_type "${cmd.event_type}" is not allowed` };
  }

  // Closed means closed.
  if (history.some(e => e.event_type === "DEAL_CLOSED")) {
    return { code: "DEAL_ALREADY_CLOSED", message: "Deal already closed; no further events allowed" };
  }

  // Authority enforcement (catalog)
  if (cmd.actor.actor_type !== def.authority.actor_type) {
    return {
      code: "AUTHORITY_MISMATCH",
      message: `Requires actor_type=${def.authority.actor_type}`
    };
  }
  if (def.authority.actor_type === "AGENT") {
    if (cmd.actor.agent_id == null || cmd.actor.agent_id !== def.authority.agent_id) {
      return {
        code: "AUTHORITY_MISMATCH",
        message: `Requires agent_id=${def.authority.agent_id}`
      };
    }
  } else {
    if (cmd.actor.agent_id != null) {
      return { code: "AUTHORITY_MISMATCH", message: "Non-AGENT must not include agent_id" };
    }
  }

  // Authority enforcement (matrix)
  if (cmd.actor.actor_type === "USER") {
    if (!matrix.users.allowed_events.includes(cmd.event_type)) {
      return { code: "AUTHORITY_MISMATCH", message: "USER not allowed for this event_type" };
    }
  }
  if (cmd.actor.actor_type === "SYSTEM") {
    if (!matrix.system.allowed_events.includes(cmd.event_type)) {
      return { code: "AUTHORITY_MISMATCH", message: "SYSTEM not allowed for this event_type" };
    }
  }
  if (cmd.actor.actor_type === "AGENT") {
    const agent = Object.values(matrix.agents).find(a => a.agent_id === cmd.actor.agent_id);
    if (!agent || !agent.allowed_events.includes(cmd.event_type)) {
      return { code: "AUTHORITY_MISMATCH", message: "AGENT not allowed for this event_type" };
    }
  }

  // Preconditions
  for (const pre of def.preconditions ?? []) {
    if (!history.some(e => e.event_type === pre)) {
      return { code: "MISSING_PRECONDITION", message: `Missing prerequisite event: ${pre}` };
    }
  }

  // Time law enforcement (sovereign):
  // DISPUTE_OPENED is only valid strictly before TIMER_EXPIRED.
  // After TIMER_EXPIRED exists in the ledger, disputes are invalid forever.
  if (cmd.event_type === "DISPUTE_OPENED") {
    if (history.some(e => e.event_type === "TIMER_EXPIRED")) {
      return { code: "DISPUTE_AFTER_EXPIRY", message: "DISPUTE_OPENED is invalid after TIMER_EXPIRED (time law)" };
    }
  }

  // Evidence gating
  if (def.requires_evidence) {
    const p = cmd.payload as any;
    if (!p?.evidence_bundle || !Array.isArray(p.evidence_bundle) || p.evidence_bundle.length === 0) {
      return { code: "MISSING_EVIDENCE", message: "This event requires payload.evidence_bundle[]" };
    }
    for (const item of p.evidence_bundle) {
      if (!item?.evidence_id || !item?.evidence_hash) {
        return { code: "MISSING_EVIDENCE", message: "Evidence items must include evidence_id and evidence_hash" };
      }
    }
  }

  // Minimal payload schema (if present)
  if (def.payload_schema) {
    if (!isObject(cmd.payload)) return { code: "INVALID_PAYLOAD", message: "payload must be an object" };
    for (const [k, rule] of Object.entries(def.payload_schema)) {
      const val = (cmd.payload as any)[k];
      if (rule.required && (val === undefined || val === null)) {
        return { code: "INVALID_PAYLOAD", message: `payload.${k} is required` };
      }
      if (val === undefined || val === null) continue;
      if (rule.type === "string" && typeof val !== "string") return { code: "INVALID_PAYLOAD", message: `payload.${k} must be string` };
      if (rule.type === "number" && typeof val !== "number") return { code: "INVALID_PAYLOAD", message: `payload.${k} must be number` };
      if (rule.type === "boolean" && typeof val !== "boolean") return { code: "INVALID_PAYLOAD", message: `payload.${k} must be boolean` };
      if (rule.type === "object" && (!isObject(val))) return { code: "INVALID_PAYLOAD", message: `payload.${k} must be object` };
      if (rule.type === "array" && !Array.isArray(val)) return { code: "INVALID_PAYLOAD", message: `payload.${k} must be array` };
    }
  }

  return null; // ACCEPT
}