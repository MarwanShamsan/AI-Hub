# AI (Autonomous Infrastructure) — Sovereign Law (Reference)

This document is a **reference law book** for the AI project. The **Instructions field** in the GPT Project remains the primary enforcement layer; this file provides the detailed, auditable definition of the system’s sovereign rules.

---

## 1) Definition

**AI (Autonomous Infrastructure)** is a sovereign, event-driven trade execution engine that binds:

- Letters of Credit (LC)
- Digital Evidence (Evidence Vault)
- Execution Tokens (A / B / C)
- Sovereign Time Law (168 hours)

**Core thesis:** money does not move by human decision; it moves only when **verified digital truth** exists and the system rules allow it.

---

## 2) Non‑Negotiable Sovereign Principles

1. **Separation of money from human decision**
   - No admin/operator/UI can force token issuance, payment release, timer pause/extend/reset, or state edits.
   - No “override” code paths exist.

2. **Events are the only source of truth**
   - The canonical record is an **append-only event stream**.
   - No mutable “current status” is authoritative; state is derived by event replay.

3. **Evidence is supreme**
   - Claims without evidence are treated as non-existent.
   - Evidence must be captured/uploaded via official AI channels (especially Agent 6 mobile app) and becomes immutable.

4. **Time Law is absolute (168 hours)**
   - On confirmed receipt, the 168h timer starts.
   - Silence within the window equals acceptance.
   - At hour 169, the right to dispute permanently expires.
   - No pause/extend/reset exists.

5. **Disputes are predefined and evidence-bound**
   - Dispute types and decision paths are predefined.
   - Disputes require evidence; late disputes are rejected.

6. **Agents are authority boundaries**
   - Exactly 9 agents. No new agents may be invented.
   - Each agent can emit only specific events (authority matrix).

---

## 3) Sovereign Agents (Exactly 9)

### Agent 1 — Supplier Qualification
**Mandate:** approve/reject supplier entry (compliance/risk).  
**Events:** `SUPPLIER_APPROVED`, `SUPPLIER_REJECTED`  
**Hard rule:** rejection is final; no explanation required.

### Agent 2 — Specification & Standards
**Mandate:** convert product agreement into measurable specs and lock them.  
**Events:** `SPECIFICATION_LOCKED`  
**Hard rule:** no vague terms; only measurable criteria.

### Agent 3 — Reference Consistency
**Mandate:** validate coherence (price/spec/capability) and anti-fraud.  
**Events:** `REFERENCE_APPROVED`, `REFERENCE_REJECTED`

### Agent 4 — Document Verification
**Mandate:** verify external documents via authoritative sources.  
**Events:** `DOCUMENTS_VERIFIED`, `DOCUMENTS_REJECTED`

### Agent 5 — Contract Architect
**Mandate:** generate executable contract policy (token rules, dispute paths).  
**Events:** `CONTRACT_SIGNED`  
**Hard rule:** no clauses enabling human exceptions or manual extensions.

### Agent 6 — Field Inspector (Human‑Bound, Constrained)
**Mandate:** capture physical reality via official mobile app evidence capture.  
**Events:** `INSPECTION_PASSED`, `INSPECTION_FAILED`  
**Hard rules:** no gallery uploads; GPS+timestamp; device binding; immutable uploads; authority expires after submission.

### Agent 7 — Logistics Verification
**Mandate:** verify shipment truth: container, seal, BOL, tracking.  
**Events:** `SHIPMENT_VERIFIED`, `SHIPMENT_REJECTED`

### Agent 8 — Time Arbiter
**Mandate:** start & expire sovereign timer; enforce finality.  
**Events:** `TIMER_STARTED`, `TIMER_EXPIRED`  
**Hard rule:** time cannot be paused/extended/reset.

### Agent 9 — Closure & Validation
**Mandate:** cross-check Agents 6/7/8 and close.  
**Events:** `TOKEN_C_ISSUED`, `DEAL_CLOSED`  
**Hard rule:** cannot close with contradictions.

---

## 4) Tokens (Execution Permissions)

Tokens are **permissions**, not assets.

- **TOKEN_A_ISSUED**
  - Condition: `INSPECTION_PASSED` exists (and prerequisites like `SPECIFICATION_LOCKED` + `CONTRACT_SIGNED`).
  - Effect: releases the first payment tranche per contract policy.

- **TOKEN_B_ISSUED**
  - Condition: `SHIPMENT_VERIFIED` exists.
  - Effect: releases shipment-related tranche per contract policy.

- **TOKEN_C_ISSUED**
  - Condition: `TIMER_EXPIRED` exists AND no valid dispute exists AND cross-validation passes.
  - Effect: releases final tranche, triggers closure, archives, burns execution authority.

---

## 5) Evidence Vault (Immutable)

Evidence must be:
- captured/uploaded via official channels (especially Agent 6 app)
- stamped with UTC time (seconds), GPS/geofence (where required), and device binding (Agent 6)
- hashed at ingestion; encrypted in transit and at rest
- immutable/read-only forever (no edit/replace/delete)

**No evidence → no event → no token → no money.**

---

## 6) Time Law (168 hours)

- Receipt confirmation triggers:
  - `GOODS_RECEIVED`
  - `TIMER_STARTED` with `expires_at = started_at + 168h`
- Scheduler emits `TIMER_EXPIRED` at expiry.
- Disputes after `TIMER_EXPIRED` are rejected.
- After `TOKEN_C_ISSUED` + `DEAL_CLOSED`, the deal is immutable and archived.

---

## 7) Interfaces (Non‑Sovereign)

MVP interfaces:
1. Client/Supplier Web: view derived state + open disputes with evidence only
2. Inspector Mobile (Agent 6): evidence capture only
3. Ops Dashboard: monitoring only (no sovereign actions)
4. System API: event/evidence/certificate exchange

Rule: no interface can both observe and decide sovereign outcomes.

---

## 8) Prohibited Patterns

- Admin “approve token” buttons
- Mutable deal status updates as source of truth
- Any UPDATE/DELETE on event history in production flows
- Accepting evidence from gallery / external uploads for Agent 6
- Timer pause/extend/reset
- Late disputes (after timer expiry)
