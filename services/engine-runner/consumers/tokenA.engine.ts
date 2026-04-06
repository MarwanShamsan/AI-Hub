import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

import { EventStore } from "../../event-ledger/repo/EventStore";
import { StoredEvent, Catalog, AuthorityMatrix, NewCommand } from "../../../ai-core/events/types";
import { validateCommand } from "../../../ai-core/policy/validate";

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

type TokenRules = any;

function loadTokenRules(policyDir: string): TokenRules {
  const p = path.join(policyDir, "token-rules.yaml");
  const raw = fs.readFileSync(p, "utf8");
  return YAML.parse(raw);
}

function resolveTokenAReleasePercent(rules: TokenRules): number | null {
  const v = rules?.tokens?.A?.release?.value;
  if (typeof v === "number") return v;

  if (typeof v === "string") {
    // ${defaults.token_A_release_percent}
    const m = v.match(/^\$\{defaults\.([A-Za-z0-9_]+)\}$/);
    if (!m) return null;
    const key = m[1];
    const resolved = rules?.defaults?.[key];
    return typeof resolved === "number" ? resolved : null;
  }

  return null;
}

export class TokenAEngine {
  private rules: TokenRules;

  constructor(
    private store: EventStore,
    private catalog: Catalog,
    private matrix: AuthorityMatrix,
    private policyDir: string,
    private systemActorId = "engine:token_a"
  ) {
    this.rules = loadTokenRules(policyDir);
  }

  private async appendSystemEventIfValid(cmd: NewCommand, history: StoredEvent[]) {
    const reject = validateCommand(this.catalog, this.matrix, cmd, slimHistory(history));
    if (reject) {
      console.error("[TokenAEngine] POLICY_REJECT", {
        deal_id: cmd.deal_id,
        event_type: cmd.event_type,
        code: reject.code,
        message: reject.message,
      });
      return null;
    }

    // Strong idempotency across multiple instances:
    return this.store.appendIfAbsentEventType(cmd, "TOKEN_A_ISSUED");
  }

  async onEvent(ev: StoredEvent) {
    const dealId = ev.deal_id;

    // أي حدث قد يُكمل الشروط، فنقرأ كامل تاريخ الصفقة
    const events = await this.store.loadDealEvents(dealId);

    const has = new Set(events.map((e) => e.event_type));

    // Eligibility (Business): SPEC + CONTRACT + INSPECTION, and not already issued
    if (
      has.has("SPECIFICATION_LOCKED") &&
      has.has("CONTRACT_SIGNED") &&
      has.has("INSPECTION_PASSED") &&
      !has.has("TOKEN_A_ISSUED")
    ) {
      const basis = latestEvent(events, "INSPECTION_PASSED");
      if (!basis) return;

      const releases = resolveTokenAReleasePercent(this.rules);
      if (releases == null) {
        console.error("[TokenAEngine] Cannot resolve TOKEN_A release percent from token-rules.yaml");
        return; // لا افتراض، لا إصدار
      }

      const cmd: NewCommand = {
        deal_id: dealId,
        event_type: "TOKEN_A_ISSUED",
        actor: { actor_type: "SYSTEM", actor_id: this.systemActorId, agent_id: null },
        payload: {
          token: "A",
          releases,
          basis_event: basis.id,
        },
      };

      const inserted = await this.appendSystemEventIfValid(cmd, events);
      if (inserted) {
        console.log("[TokenAEngine] TOKEN_A_ISSUED appended", {
          deal_id: dealId,
          stream_seq: inserted.stream_seq,
        });
      }
    }
  }
}