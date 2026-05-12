import { kalshiReadonlyAdapterContractId } from "./kalshi-readonly-adapter-contract-id.js";

export const allowedOperationCategories = [
  "market_discovery",
  "market_metadata",
  "orderbook_snapshot_read"
];

export const forbiddenOperationCategories = [
  "order_placement",
  "order_cancellation",
  "position_management",
  "portfolio_access",
  "balance_access",
  "account_access",
  "credential_handling",
  "authenticated_trading",
  "deposit",
  "withdrawal",
  "recommendations",
  "picks",
  "signals",
  "decisions",
  "bankroll_sizing",
  "live_execution"
];

export function buildKalshiReadonlyAdapterContract(options = {}) {
  const generatedAt = options.generatedAt ?? "2026-05-11T00:00:00Z";
  const adapterName = "kalshi_readonly_adapter";
  const adapterVersion = "0.1.0-contract-only";

  return {
    kalshi_readonly_adapter_contract_id: kalshiReadonlyAdapterContractId({
      adapterName,
      adapterVersion,
      allowedOperationCount: allowedOperationCategories.length,
      forbiddenOperationCount: forbiddenOperationCategories.length
    }),
    schema_version: "kalshi_readonly_adapter_contract.v1",
    generated_at: generatedAt,
    adapter_name: adapterName,
    adapter_version: adapterVersion,
    source_system: "kalshi",
    adapter_mode: "read_only_contract_only",
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    credentials_allowed: false,
    network_client_allowed: false,
    allowed_operation_categories: allowedOperationCategories,
    forbidden_operation_categories: forbiddenOperationCategories,
    contract_scope: "contract_definition_only",
    status: "kalshi_readonly_adapter_contract_ready",
    reason_code: "VALIDATION_PASSED",
    reason: "read-only adapter contract ready"
  };
}
