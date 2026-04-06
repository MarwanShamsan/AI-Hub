import { buildTestApp } from "../helpers/buildTestApp";

describe("POST /commands - DEAL_CREATED forbidden", () => {
  it("should reject DEAL_CREATED from generic commands endpoint", async () => {
    const app = await buildTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/commands",
      headers: {
        authorization: "Bearer test-user"
      },
      payload: {
        deal_id: "11111111-1111-1111-1111-111111111111",
        event_type: "DEAL_CREATED",
        payload: {
          deal_title: "Hack Attempt",
          buyer_id: "x",
          supplier_id: "y",
          currency: "USD"
        }
      }
    });

    expect(res.statusCode).toBe(403);

    const body = res.json();

    expect(body.reason).toBe("DEAL_CREATED_FORBIDDEN");
  });
});