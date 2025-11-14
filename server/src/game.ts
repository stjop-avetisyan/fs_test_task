export const SYMBOLS = ['🍊', '🍇', '🍒', '🔔'] as const
export type SymbolType = typeof SYMBOLS[number]

export const PROB: Record<SymbolType, number> = { '🍊': 0.5, '🍇': 0.25, '🍒': 0.15, '🔔': 0.1 }
export const PAYOUT: Record<SymbolType, number> = { '🍊': 1, '🍇': 4, '🍒': 8, '🔔': 20 }
export const BETS = [0.1, 0.5, 1, 2, 5, 10]

export function weightedPick(): SymbolType {
  const r = Math.random()
  let acc = 0
  for (const s of SYMBOLS) {
    acc += PROB[s]
    if (r <= acc) return s
  }
  return '🍊'
}
