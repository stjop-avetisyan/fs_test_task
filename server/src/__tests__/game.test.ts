import { BETS, PAYOUT, PROB, SYMBOLS, weightedPick } from '../game.js'

function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0) }

describe('game config', () => {
  test('symbols list is correct and unique', () => {
    expect(SYMBOLS).toEqual(['🍊', '🍇', '🍒', '🔔'])
    const set = new Set(SYMBOLS)
    expect(set.size).toBe(SYMBOLS.length)
  })

  test('bets list contains required values', () => {
    expect(BETS).toEqual([0.1, 0.5, 1, 2, 5, 10])
  })

  test('probabilities match symbols and sum to 1', () => {
    const probKeys = Object.keys(PROB)
    expect(probKeys.sort()).toEqual([...SYMBOLS].sort())
    const total = sum(Object.values(PROB))
    expect(Math.abs(total - 1)).toBeLessThan(1e-9)
  })

  test('payouts match symbols and are positive', () => {
    const payoutKeys = Object.keys(PAYOUT)
    expect(payoutKeys.sort()).toEqual([...SYMBOLS].sort())
    for (const s of SYMBOLS) {
      expect(PAYOUT[s]).toBeGreaterThan(0)
    }
  })
})

describe('weightedPick', () => {
  test('returns only allowed symbols', () => {
    for (let i = 0; i < 1000; i++) {
      const s = weightedPick()
      expect(SYMBOLS.includes(s)).toBe(true)
    }
  })

  test('empirical distribution matches configured probabilities', () => {
    const n = 50000
    const counts: Record<string, number> = {}
    for (const s of SYMBOLS) counts[s] = 0

    for (let i = 0; i < n; i++) {
      const s = weightedPick()
      counts[s]++
    }

    for (const s of SYMBOLS) {
      const p = PROB[s]
      const expected = n * p
      const variance = n * p * (1 - p)
      const stdDev = Math.sqrt(variance)
      const tolerance = 5 * stdDev
      const delta = Math.abs(counts[s] - expected)
      expect(delta).toBeLessThanOrEqual(tolerance)
    }
  })
})
