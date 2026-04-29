import { bestBid, bookImbalance, impliedAskFromOppositeBid, mid, sideDepth, spread } from "./book-math.js";
import { liquidityStatus, stalenessStatus } from "./liquidity-checks.js";

export function normalizeBinaryOrderBook(book, options = {}) {
  const qualityFlags = validateBook(book);
  const yesBidLevel = bestBid(book.yes_bids);
  const noBidLevel = bestBid(book.no_bids);
  const bestYesBid = yesBidLevel?.price_cents ?? null;
  const bestNoBid = noBidLevel?.price_cents ?? null;
  const bestYesAsk = impliedAskFromOppositeBid(bestNoBid);
  const bestNoAsk = impliedAskFromOppositeBid(bestYesBid);
  const yesSpread = spread(bestYesBid, bestYesAsk);
  const noSpread = spread(bestNoBid, bestNoAsk);
  const yesDepth = sideDepth(book.yes_bids);
  const noDepth = sideDepth(book.no_bids);

  if (yesSpread !== null && yesSpread < 0) {
    qualityFlags.push("crossed_book");
  }

  if (yesSpread === 0 || noSpread === 0) {
    qualityFlags.push("locked_book");
  }

  if (bestYesBid === null) {
    qualityFlags.push("empty_yes_bids");
  }

  if (bestNoBid === null) {
    qualityFlags.push("empty_no_bids");
  }

  const staleness = stalenessStatus({
    capturedAt: book.captured_at,
    receivedAt: book.received_at,
    staleAfterMs: options.staleAfterMs
  });
  if (staleness !== "fresh") {
    qualityFlags.push(staleness);
  }

  return {
    market_id: book.market_id,
    source_event_id: book.source_event_id,
    captured_at: book.captured_at,
    received_at: book.received_at,
    price_unit: "cents",
    best_yes_bid: bestYesBid,
    best_yes_ask: bestYesAsk,
    best_no_bid: bestNoBid,
    best_no_ask: bestNoAsk,
    yes_spread: yesSpread,
    no_spread: noSpread,
    yes_mid: mid(bestYesBid, bestYesAsk),
    no_mid: mid(bestNoBid, bestNoAsk),
    yes_depth: yesDepth,
    no_depth: noDepth,
    book_imbalance: bookImbalance(yesDepth, noDepth),
    liquidity_status: liquidityStatus({
      yesDepth,
      noDepth,
      qualityFlags,
      thinDepthThreshold: options.thinDepthThreshold
    }),
    staleness_status: staleness,
    quality_flags: [...new Set(qualityFlags)].sort()
  };
}

export function validateBook(book) {
  const qualityFlags = [];

  if (!book || typeof book !== "object") {
    return ["invalid_book"];
  }

  for (const side of ["yes_bids", "no_bids"]) {
    if (!Array.isArray(book[side])) {
      qualityFlags.push("invalid_side_book");
      continue;
    }

    for (const level of book[side]) {
      if (!Number.isInteger(level.price_cents) || level.price_cents < 0 || level.price_cents > 100) {
        qualityFlags.push("invalid_price");
      }

      if (!Number.isInteger(level.quantity) || level.quantity < 0) {
        qualityFlags.push("invalid_quantity");
      }
    }
  }

  return qualityFlags;
}
