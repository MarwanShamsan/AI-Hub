export type ActorType = "USER" | "AGENT" | "SYSTEM";

export type Identity = {
  actor_type: ActorType;
  actor_id: string;
  agent_id: number | null;
  tenant_id?: string;
};

export type NewCommand = {
  deal_id: string;
  event_type: string;
  payload: unknown;
  actor: Identity;
};

export type StoredEvent = {
  id: string;
  deal_id: string;
  stream_seq: number;
  event_type: string;
  actor_type: ActorType;
  actor_id: string;
  agent_id: number | null;
  payload: unknown;
  prev_hash: string | null;
  hash: string;
  created_at: string; // UTC ISO
};

export type CatalogEventDef = {
  event_type: string;
  authority: { actor_type: ActorType; agent_id: number | null };
  requires_evidence: boolean;
  preconditions: string[];
  payload_schema?: Record<string, { type: "string"|"number"|"boolean"|"object"|"array"; required?: boolean }>;
};

export type Catalog = {
  events: Record<string, CatalogEventDef>;
};

export type AuthorityMatrix = {
  users: { allowed_events: string[] };
  system: { allowed_events: string[] };
  agents: Record<string, { agent_id: number; allowed_events: string[] }>;
};

export type PolicyReject = {
  code:
    | "UNKNOWN_EVENT_TYPE"
    | "AUTHORITY_MISMATCH"
    | "MISSING_PRECONDITION"
    | "MISSING_EVIDENCE"
    | "INVALID_PAYLOAD"
    | "DEAL_ALREADY_CLOSED"
    | "DISPUTE_AFTER_EXPIRY";
  message: string;
};
