import { PoolClient } from "pg";
import { DealRegistryRepo } from "../../event-ledger/repo/DealRegistryRepo";

export async function applyDealEvent(
  client: PoolClient,
  ev: any
): Promise<void> {
  const p = ev.payload ?? {};

  // get tenant_id from registry (NOT from event)
  const registry = new DealRegistryRepo(client as any);
  const entry = await registry.get(ev.deal_id);

  if (!entry) {
    return;
  }

  const tenantId = entry.tenant_id;

  // ensure deal projection row exists
  await client.query(
    `
    INSERT INTO views.deal_projection (deal_id, tenant_id, status)
    VALUES ($1, $2, 'CREATED')
    ON CONFLICT (deal_id) DO NOTHING
    `,
    [ev.deal_id, tenantId]
  );

  // ensure timer index row exists
  await client.query(
    `
    INSERT INTO views.timer_index (deal_id, tenant_id, state)
    VALUES ($1, $2, 'NONE')
    ON CONFLICT (deal_id) DO NOTHING
    `,
    [ev.deal_id, tenantId]
  );

  switch (ev.event_type) {
    case "DEAL_CREATED":
      await client.query(
        `
        UPDATE views.deal_projection
        SET
          deal_title = $2,
          buyer_id = $3,
          supplier_id = $4,
          currency = $5,
          status = 'CREATED'
        WHERE deal_id = $1
        `,
        [
          ev.deal_id,
          p.deal_title,
          p.buyer_id,
          p.supplier_id,
          p.currency
        ]
      );
      break;

    case "INSPECTION_PASSED":
      await client.query(
        `
        UPDATE views.deal_projection
        SET
          inspection_passed = TRUE,
          status = 'INSPECTED'
        WHERE deal_id = $1
        `,
        [ev.deal_id]
      );
      break;

    case "TOKEN_A_ISSUED":
      await client.query(
        `
        UPDATE views.deal_projection
        SET token_a_issued = TRUE
        WHERE deal_id = $1
        `,
        [ev.deal_id]
      );
      break;

    case "SHIPMENT_VERIFIED":
      await client.query(
        `
        UPDATE views.deal_projection
        SET
          shipment_verified = TRUE,
          status = 'IN_TRANSIT'
        WHERE deal_id = $1
        `,
        [ev.deal_id]
      );
      break;

    case "TOKEN_B_ISSUED":
      await client.query(
        `
        UPDATE views.deal_projection
        SET token_b_issued = TRUE
        WHERE deal_id = $1
        `,
        [ev.deal_id]
      );
      break;

    case "TIMER_STARTED":
      await client.query(
        `
        UPDATE views.deal_projection
        SET timer_started = TRUE
        WHERE deal_id = $1
        `,
        [ev.deal_id]
      );

      await client.query(
        `
        UPDATE views.timer_index
        SET
          started_at = $2,
          expires_at = $3,
          expired_at = NULL,
          state = 'RUNNING',
          updated_at = now()
        WHERE deal_id = $1
        `,
        [
          ev.deal_id,
          p.started_at ?? null,
          p.expires_at ?? null
        ]
      );
      break;

    case "TIMER_EXPIRED":
      await client.query(
        `
        UPDATE views.deal_projection
        SET
          timer_expired = TRUE,
          status = 'COMPLETING'
        WHERE deal_id = $1
        `,
        [ev.deal_id]
      );

      await client.query(
        `
        UPDATE views.timer_index
        SET
          expired_at = $2,
          state = 'EXPIRED',
          updated_at = now()
        WHERE deal_id = $1
        `,
        [
          ev.deal_id,
          p.expired_at ?? p.expires_at ?? ev.created_at
        ]
      );
      break;

    case "DISPUTE_OPENED":
      await client.query(
        `
        UPDATE views.deal_projection
        SET
          dispute_open = TRUE,
          status = 'DISPUTED'
        WHERE deal_id = $1
        `,
        [ev.deal_id]
      );
      break;

    case "DISPUTE_RESOLVED":
      await client.query(
        `
        UPDATE views.deal_projection
        SET dispute_open = FALSE
        WHERE deal_id = $1
        `,
        [ev.deal_id]
      );
      break;

    case "TOKEN_C_ISSUED":
      await client.query(
        `
        UPDATE views.deal_projection
        SET
          token_c_issued = TRUE,
          deal_closed = TRUE,
          status = 'COMPLETED'
        WHERE deal_id = $1
        `,
        [ev.deal_id]
      );
      break;
  }

  await client.query(
    `
    UPDATE views.deal_projection
    SET
      last_event_type = $2,
      last_event_at = $3,
      updated_at = now()
    WHERE deal_id = $1
    `,
    [ev.deal_id, ev.event_type, ev.created_at]
  );
}