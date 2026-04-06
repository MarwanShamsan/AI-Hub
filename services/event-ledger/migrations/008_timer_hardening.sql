-- services/event-ledger/migrations/00X_timer_hardening.sql

-- Ensure TIMER_STARTED is emitted once per deal
CREATE UNIQUE INDEX IF NOT EXISTS uq_timer_started_once
ON events (deal_id)
WHERE event_type = 'TIMER_STARTED';

-- Ensure TIMER_EXPIRED is emitted once per deal
CREATE UNIQUE INDEX IF NOT EXISTS uq_timer_expired_once
ON events (deal_id)
WHERE event_type = 'TIMER_EXPIRED';