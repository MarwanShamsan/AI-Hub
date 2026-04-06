import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

import { EventStore } from "../../event-ledger/repo/EventStore";
import { StoredEvent, Catalog, AuthorityMatrix, NewCommand } from "../../../ai-core/events/types";
import { validateCommand } from "../../../ai-core/policy/validate";

type TokenRules = any;

function slimHistory(history: StoredEvent[]) {
  return history.map((e) => ({
    event_type: e.event_type,
    payload: e.payload,
    created_at: e.created_at,
  }));
}

function latestEvent(events: StoredEvent[], type: string): StoredEvent | null {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].event_type === type) return events[i];
  }
  return null;
}

function loadTokenRules(policyDir: string): TokenRules {
  const p = path.join(policyDir, "token-rules.yaml");
  const raw = fs.readFileSync(p, "utf8");
  return YAML.parse(raw);
}

function resolveTokenReleasePercent(rules: TokenRules, tokenKey: "A" | "B" | "C"): number | null {
  const v = rules?.tokens?.[tokenKey]?.release?.value;

  if (typeof v === "number") return v;

  if (typeof v === "string") {
    // ${defaults.token_B_release_percent}
    const m = v.match(/^\$\{defaults\.([A-Za-z0-9_]+)\}$/);
    if (!m) return null;
    const key = m[1];
    const resolved = rules?.defaults?.[key];
    return typeof resolved === "number" ? resolved : null;
  }

  return null;
}

export class TokenBEngine {
  private rules: TokenRules;

  constructor(
    private store: EventStore,
    private catalog: Catalog,
    private matrix: AuthorityMatrix,
    private policyDir: string,
    private systemActorId = "engine:token_b"
  ) {
    this.rules = loadTokenRules(policyDir);
  }

  private async appendSystemEventIfValid(cmd: NewCommand, history: StoredEvent[]) {
    const reject = validateCommand(this.catalog, this.matrix, cmd, slimHistory(history));
    if (reject) {
      console.error("[TokenBEngine] POLICY_REJECT", {
        deal_id: cmd.deal_id,
        event_type: cmd.event_type,
        code: reject.code,
        message: reject.message,
      });
      return null;
    }

    // Strong idempotency across multiple instances:
    return this.store.appendIfAbsentEventType(cmd, "TOKEN_B_ISSUED");
  }

  async onEvent(ev: StoredEvent) {
    const dealId = ev.deal_id;

    const events = await this.store.loadDealEvents(dealId);
    const has = new Set(events.map((e) => e.event_type));

    // Eligibility (Business): shipment verified & not already issued (and token A should exist)
    if (
      has.has("SHIPMENT_VERIFIED") &&
      has.has("TOKEN_A_ISSUED") &&
      !has.has("TOKEN_B_ISSUED")
    ) {
      const basis = latestEvent(events, "SHIPMENT_VERIFIED");
      if (!basis) return;

      const releases = resolveTokenReleasePercent(this.rules, "B");
      if (releases == null) {
        console.error("[TokenBEngine] Cannot resolve TOKEN_B release percent from token-rules.yaml");
        return;
      }

      const cmd: NewCommand = {
        deal_id: dealId,
        event_type: "TOKEN_B_ISSUED",
        actor: { actor_type: "SYSTEM", actor_id: this.systemActorId, agent_id: null },
        payload: {
          token: "B",
          releases,
          basis_event: basis.id,
        },
      };

      const inserted = await this.appendSystemEventIfValid(cmd, events);
      if (inserted) {
        console.log("[TokenBEngine] TOKEN_B_ISSUED appended", {
          deal_id: dealId,
          stream_seq: inserted.stream_seq,
        });
      }
    }
  }
}