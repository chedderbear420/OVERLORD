export function calculatePaperPnl(input) {
  const paperEntryPrice = input.paper_entry_price;
  const paperExitPrice = input.paper_exit_price;
  const paperQuantity = input.paper_quantity;
  validatePrice(paperEntryPrice, "paper_entry_price");
  validatePrice(paperExitPrice, "paper_exit_price");
  if (!Number.isInteger(paperQuantity) || paperQuantity <= 0) {
    throw new Error("paper_quantity must be a positive integer");
  }

  const entryNotionalCents = paperEntryPrice * paperQuantity;
  const exitNotionalCents = paperExitPrice * paperQuantity;
  const grossPnlCents = exitNotionalCents - entryNotionalCents;
  const estimatedFeeCents = 0;

  return {
    entry_notional_cents: entryNotionalCents,
    exit_notional_cents: exitNotionalCents,
    gross_pnl_cents: grossPnlCents,
    estimated_fee_cents: estimatedFeeCents,
    net_pnl_cents: grossPnlCents - estimatedFeeCents
  };
}

export function validatePrice(value, fieldName) {
  if (!Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error(`${fieldName} must be integer cents from 0 to 100`);
  }
}
