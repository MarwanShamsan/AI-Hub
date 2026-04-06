import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

import { EventStore } from "../../event-ledger/repo/EventStore";
import { StoredEvent, Catalog, AuthorityMatrix, NewCommand } from "../../../ai-core/events/types";
import { validateCommand } from "../../../ai-core/policy/validate";
import { nowUtcIso } from "../../../shared/time/utc";

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
    // ${defaults.token_C_release_percent}
    const m = v.match(/^\$\{defaults\.([A-Za-z0-9_]+)\}$/);
    if (!m) return null;
    const key = m[1];
    const resolved = rules?.defaults?.[key];
    return typeof resolved === "number" ? resolved : null;
  }

  return null;
}

/**
 * نزاع مفتوح = يوجد DISPUTE_OPENED بدون DISPUTE_RESOLVED/REJECTED بعده
 */
function hasOpenDispute(events: StoredEvent[]): boolean {
  const lastOpenIdx = (() => {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].event_type === "DISPUTE_OPENED") return i;
    }
    return -1;
  })();

  if (lastOpenIdx === -1) return false;

  for (let j = events.length - 1; j > lastOpenIdx; j--) {
    const t = events[j].event_type;
    if (t === "DISPUTE_RESOLVED" || t === "DISPUTE_REJECTED") return false;
  }

  return true;
}

function latestInspectionOutcome(events: StoredEvent[]): "PASSED" | "FAILED" | "NONE" {
  for (let i = events.length - 1; i >= 0; i--) {
    const t = events[i].event_type;
    if (t === "INSPECTION_PASSED") return "PASSED";
    if (t === "INSPECTION_FAILED") return "FAILED";
  }
  return "NONE";
}

function latestShipmentOutcome(events: StoredEvent[]): "VERIFIED" | "REJECTED" | "NONE" {
  for (let i = events.length - 1; i >= 0; i--) {
    const t = events[i].event_type;
    if (t === "SHIPMENT_VERIFIED") return "VERIFIED";
    if (t === "SHIPMENT_REJECTED") return "REJECTED";
  }
  return "NONE";
}

export class TokenCEngine {
  private rules: TokenRules;

  constructor(
    private store: EventStore,
    private catalog: Catalog,
    private matrix: AuthorityMatrix,
    private policyDir: string,
    private agent9ActorId = "agent-9-engine"
  ) {
    this.rules = loadTokenRules(policyDir);
  }

  private async appendIfValid(cmd: NewCommand, history: StoredEvent[], uniqueEventType: string) {
    const reject = validateCommand(this.catalog, this.matrix, cmd, slimHistory(history));
    if (reject) {
      console.error("[TokenCEngine] POLICY_REJECT", {
        deal_id: cmd.deal_id,
        event_type: cmd.event_type,
        code: reject.code,
        message: reject.message,
      });
      return null;
    }

    return this.store.appendIfAbsentEventType(cmd, uniqueEventType);
  }

  async onEvent(ev: StoredEvent) {
    const dealId = ev.deal_id;

    const events = await this.store.loadDealEvents(dealId);
    const has = new Set(events.map((e) => e.event_type));

    // 1) إذا TOKEN_C موجود لكن DEAL_CLOSED غير موجود => حاول الإغلاق (self-heal)
    if (has.has("TOKEN_C_ISSUED") && !has.has("DEAL_CLOSED")) {
      const closeCmd: NewCommand = {
        deal_id: dealId,
        event_type: "DEAL_CLOSED",
        actor: { actor_type: "AGENT", actor_id: this.agent9ActorId, agent_id: 9 },
        payload: {
          closed_at: nowUtcIso(),
        },
      };

      const inserted = await this.appendIfValid(closeCmd, events, "DEAL_CLOSED");
      if (inserted) {
        console.log("[TokenCEngine] DEAL_CLOSED appended", { deal_id: dealId, stream_seq: inserted.stream_seq });
      }
      return;
    }

    // 2) Eligibility لـ TOKEN_C
    if (!has.has("TIMER_EXPIRED")) return;
    if (has.has("TOKEN_C_ISSUED")) return;

    if (hasOpenDispute(events)) {
      // لا نزاع => لا إغلاق
      return;
    }

    const insp = latestInspectionOutcome(events);
    const ship = latestShipmentOutcome(events);
    const contradiction = insp === "FAILED" || ship === "REJECTED";
    if (contradiction) return;

    const basis = latestEvent(events, "TIMER_EXPIRED");
    if (!basis) return;

    const releases = resolveTokenReleasePercent(this.rules, "C");
    if (releases == null) {
      console.error("[TokenCEngine] Cannot resolve TOKEN_C release percent from token-rules.yaml");
      return;
    }

    // 2.1) إصدار TOKEN_C_ISSUED (Agent 9)
    const tokenCmd: NewCommand = {
      deal_id: dealId,
      event_type: "TOKEN_C_ISSUED",
      actor: { actor_type: "AGENT", actor_id: this.agent9ActorId, agent_id: 9 },
      payload: {
        token: "C",
        releases,
        basis_event: basis.id,
      },
    };

    const insertedTokenC = await this.appendIfValid(tokenCmd, events, "TOKEN_C_ISSUED");
    if (!insertedTokenC) {
      // إما مرفوض policy أو سبق إدراجه من instance أخرى
      return;
    }

    // 2.2) بعد TOKEN_C، حاول إصدار DEAL_CLOSED
    // (نستخدم تاريخ محلي مضاف إليه TOKEN_C لضمان validateCommand يمرّ precondition)
    const historyPlusTokenC: StoredEvent[] = events.concat([
      {
        id: insertedTokenC.id,
        deal_id: insertedTokenC.deal_id,
        stream_seq: insertedTokenC.stream_seq,
        event_type: insertedTokenC.event_type,
        actor_type: insertedTokenC.actor_type,
        actor_id: insertedTokenC.actor_id,
        agent_id: insertedTokenC.agent_id,
        payload: insertedTokenC.payload,
        prev_hash: insertedTokenC.prev_hash,
        hash: insertedTokenC.hash,
        created_at: insertedTokenC.created_at,
      },
    ]);

    const closeCmd: NewCommand = {
      deal_id: dealId,
      event_type: "DEAL_CLOSED",
      actor: { actor_type: "AGENT", actor_id: this.agent9ActorId, agent_id: 9 },
      payload: {
        closed_at: nowUtcIso(),
      },
    };

    const insertedClosed = await this.appendIfValid(closeCmd, historyPlusTokenC, "DEAL_CLOSED");
    if (insertedClosed) {
      console.log("[TokenCEngine] DEAL_CLOSED appended", { deal_id: dealId, stream_seq: insertedClosed.stream_seq });
    }
  }
}