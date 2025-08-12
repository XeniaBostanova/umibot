export function computeNewPrice(
  myPrice: number,
  competitorMin: number,
  step = 0.01,
  minPrice = 0
): number | null {
  if (competitorMin >= myPrice) return null; // мы уже не дороже
  const target = Math.max(minPrice, +(competitorMin - step).toFixed(2));
  if (target < minPrice) return null;
  if (target === myPrice) return null;
  return target;
}
