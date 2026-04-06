export type Deal = {
  deal_id: string;
  tenant_id?: string;

  deal_title: string;
  buyer_id: string;
  supplier_id: string;
  currency: string;

  status: string;

  token_a_issued: boolean;
  token_b_issued: boolean;
  token_c_issued: boolean;

  shipment_verified: boolean;
  inspection_passed: boolean;

  dispute_open: boolean;
  deal_closed: boolean;

  timer_started: boolean;
  timer_expired: boolean;

  last_event_type: string;
  last_event_at?: string;
  updated_at: string;
};

export type DealsListResponse = {
  status: "ACCEPTED";
  count?: number;
  deals: Deal[];
};

export type DealResponse = {
  status: "ACCEPTED";
  deal: Deal;
};

export type Timer = {
  deal_id?: string;
  tenant_id?: string;
  started_at: string | null;
  expires_at: string | null;
  expired_at?: string | null;
  state: string;
  updated_at?: string;
};

export type TimerResponse = {
  status: "ACCEPTED";
  timer: Timer;
};