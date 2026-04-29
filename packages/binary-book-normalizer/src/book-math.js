export function bestBid(levels) {
  if (!Array.isArray(levels) || levels.length === 0) {
    return null;
  }

  return levels.reduce((best, level) =>
    best === null || level.price_cents > best.price_cents ? level : best
  , null);
}

export function impliedAskFromOppositeBid(oppositeBidPrice) {
  return oppositeBidPrice === null ? null : 100 - oppositeBidPrice;
}

export function spread(bid, ask) {
  return bid === null || ask === null ? null : ask - bid;
}

export function mid(bid, ask) {
  return bid === null || ask === null ? null : (bid + ask) / 2;
}

export function sideDepth(levels) {
  if (!Array.isArray(levels)) {
    return 0;
  }

  return levels.reduce((total, level) => total + level.quantity, 0);
}

export function bookImbalance(yesDepth, noDepth) {
  const totalDepth = yesDepth + noDepth;
  if (totalDepth === 0) {
    return null;
  }

  return (yesDepth - noDepth) / totalDepth;
}
