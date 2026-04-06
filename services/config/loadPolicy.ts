import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { Catalog, AuthorityMatrix } from "../../ai-core/events/types";

export function loadCatalog(policyDir: string): Catalog {
  const p = path.join(policyDir, "event-catalog.yaml");
  const raw = fs.readFileSync(p, "utf8");
  const doc = YAML.parse(raw);

  // Expect structure: { events: { EVENT_TYPE: { authority, requires_evidence, preconditions, payload_schema } } }
  if (!doc?.events) throw new Error("event-catalog.yaml missing 'events' root key");

  return { events: doc.events };
}

export function loadAuthorityMatrix(policyDir: string): AuthorityMatrix {
  const p = path.join(policyDir, "agent-authority-matrix.yaml");
  const raw = fs.readFileSync(p, "utf8");
  const doc = YAML.parse(raw);

  // Expect structure: { users: { allowed_events: [] }, system: { allowed_events: [] }, agents: { ... } }
  if (!doc?.agents || !doc?.users || !doc?.system) {
    throw new Error("agent-authority-matrix.yaml must include users/system/agents");
  }
  return doc as AuthorityMatrix;
}
