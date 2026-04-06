import {
  tokenAApplyEvent,
  tokenAEligible,
  tokenAInitialState,
} from "../ai-core/engines/token-a/tokenA.policy";

describe("TOKEN_A policy", () => {
  test("يصبح eligible عند تحقق الشروط الثلاثة وعدم وجود TOKEN_A_ISSUED", () => {
    let s = tokenAInitialState();
    s = tokenAApplyEvent(s, "SPECIFICATION_LOCKED");
    s = tokenAApplyEvent(s, "CONTRACT_SIGNED");
    s = tokenAApplyEvent(s, "INSPECTION_PASSED");

    expect(tokenAEligible(s)).toBe(true);
  });

  test("لا يصبح eligible إذا كان TOKEN_A_ISSUED موجودًا", () => {
    let s = tokenAInitialState();
    s = tokenAApplyEvent(s, "SPECIFICATION_LOCKED");
    s = tokenAApplyEvent(s, "CONTRACT_SIGNED");
    s = tokenAApplyEvent(s, "INSPECTION_PASSED");
    s = tokenAApplyEvent(s, "TOKEN_A_ISSUED");

    expect(tokenAEligible(s)).toBe(false);
  });
});
