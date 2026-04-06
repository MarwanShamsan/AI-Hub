# AI — Time Law (168 Hours)

This document defines the **sovereign, irreversible timer** used in AI deals.

---

## 1) Trigger

The 168-hour timer starts when goods receipt is confirmed (receipt event exists):

- `GOODS_RECEIVED` (user-side confirmation / receipt record)
- `TIMER_STARTED` (Agent 8 Time Arbiter emits)

`TIMER_STARTED` includes:
- `started_at` (server UTC)
- `expires_at = started_at + 168 hours`

---

## 2) Sovereign Rule

- During the 168-hour window, the buyer may open a dispute **only with evidence**.
- **Silence** within 168 hours equals sovereign acceptance.
- After expiry:
  - disputes are **invalid forever**
  - no manual reopening exists
  - no pause/extend/reset exists

At expiry the system must emit:
- `TIMER_EXPIRED` (Agent 8)

---

## 3) Disputes and Expiry

- A dispute is valid only if:
  - opened after `TIMER_STARTED`
  - opened before `TIMER_EXPIRED`
  - contains required evidence bundle
- Any dispute attempt after `TIMER_EXPIRED` must be rejected:
  - emit `DISPUTE_REJECTED` with reason `LATE_AFTER_EXPIRY`

---

## 4) Closure

After `TIMER_EXPIRED`, if no valid dispute remains open and cross-validation passes, Agent 9 may:
- emit `TOKEN_C_ISSUED`
- emit `DEAL_CLOSED`

Closure is final and immutable.

---

## 5) Prohibitions

- No timer pause
- No timer extension
- No timer reset
- No “admin exception”
- No “manual acceptance”
