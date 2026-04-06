import fs from "fs";
import path from "path";
import YAML from "yaml";
import { EventStore } from "../../event-ledger/repo/EventStore";
import { StoredEvent } from "../../../ai-core/events/types";
import { buildDealState } from "./dealState";

export class TokenEngine {
  private tokenRules: any;

  constructor(private store: EventStore) {
    const policyDir = process.env.POLICY_DIR ?? "./policy";
    const file = path.join(policyDir, "token-rules.yaml");
    const raw = fs.readFileSync(file, "utf8");
    this.tokenRules = YAML.parse(raw);
  }

  private resolveRelease(tokenKey: string): number | null {
    const token = this.tokenRules?.tokens?.[tokenKey];
    if (!token) return null;

    const value = token.release?.value;
    if (!value) return null;

    if (typeof value === "number") return value;

    if (typeof value === "string") {
      const match = value.match(/\$\{defaults\.(.+)\}/);
      if (!match) return null;

      const key = match[1];
      const resolved = this.tokenRules.defaults?.[key];
      if (typeof resolved === "number") return resolved;
    }

    return null;
  }

  private findLatest(events: StoredEvent[], type: string) {
    return [...events].reverse().find(e => e.event_type === type);
  }

  async onEvent(ev: StoredEvent) {
    const dealId = ev.deal_id;

    const events = await this.store.loadDealEvents(dealId);
    const st = buildDealState(events);

    // =========================
    // TOKEN A
    // =========================
    if (
      st.has.has("INSPECTION_PASSED") &&
      !st.has.has("TOKEN_A_ISSUED")
    ) {
      const inspection = this.findLatest(events, "INSPECTION_PASSED");
      if (!inspection) return;

      const releases = this.resolveRelease("A");
      if (releases == null) return;

      await this.store.append({
        deal_id: dealId,
        event_type: "TOKEN_A_ISSUED",
        actor: {
          actor_type: "SYSTEM",
          actor_id: "engine:token",
          agent_id: null
        },
        payload: {
          token: "A",
          releases,
          basis_event: inspection.id
        }
      });
    }
  }
}