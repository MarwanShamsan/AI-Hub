export type TokenADealState = {
  hasSpecLocked: boolean;
  hasContractSigned: boolean;
  hasInspectionPassed: boolean;
  hasTokenAIssued: boolean;
};

export function tokenAInitialState(): TokenADealState {
  return {
    hasSpecLocked: false,
    hasContractSigned: false,
    hasInspectionPassed: false,
    hasTokenAIssued: false,
  };
}

export function tokenAApplyEvent(
  state: TokenADealState,
  eventType: string
): TokenADealState {
  // Pure-ish: نرجع نسخة جديدة لتفادي أي التباس
  const next: TokenADealState = { ...state };

  switch (eventType) {
    case "SPECIFICATION_LOCKED":
      next.hasSpecLocked = true;
      break;
    case "CONTRACT_SIGNED":
      next.hasContractSigned = true;
      break;
    case "INSPECTION_PASSED":
      next.hasInspectionPassed = true;
      break;
    case "TOKEN_A_ISSUED":
      next.hasTokenAIssued = true;
      break;
    default:
      break;
  }

  return next;
}

export function tokenAEligible(state: TokenADealState): boolean {
  return (
    state.hasSpecLocked &&
    state.hasContractSigned &&
    state.hasInspectionPassed &&
    !state.hasTokenAIssued
  );
}
