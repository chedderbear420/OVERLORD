export function liquidityStatus({ yesDepth, noDepth, qualityFlags, thinDepthThreshold = 25 }) {
  if (qualityFlags.includes("invalid_price") || qualityFlags.includes("invalid_quantity") || qualityFlags.includes("crossed_book")) {
    return "invalid";
  }

  if (yesDepth === 0 && noDepth === 0) {
    return "empty";
  }

  if (yesDepth < thinDepthThreshold || noDepth < thinDepthThreshold) {
    return "thin";
  }

  return "liquid";
}

export function stalenessStatus({ capturedAt, receivedAt, staleAfterMs = 60_000 }) {
  if (!capturedAt || !receivedAt) {
    return "missing_timestamp";
  }

  const captured = Date.parse(capturedAt);
  const received = Date.parse(receivedAt);

  if (Number.isNaN(captured) || Number.isNaN(received)) {
    return "invalid_timestamp";
  }

  if (captured > received) {
    return "future_timestamp";
  }

  return received - captured > staleAfterMs ? "stale" : "fresh";
}
