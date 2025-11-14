import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { wallet } from './walletAdapter.js';
import { SYMBOLS, PROB, PAYOUT, BETS, weightedPick } from './game.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const DATABASE_URL = process.env.DATABASE_URL!;
const CASINO_BASE_URL = process.env.CASINO_BASE_URL!;
const CASINO_SECRET = process.env.CASINO_SECRET!;
const OPERATOR_NAME = process.env.OPERATOR_NAME || 'Operator Name';

const pool = new Pool({ connectionString: DATABASE_URL });

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE,
      operator TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS rounds (
      id UUID PRIMARY KEY,
      player_token TEXT NOT NULL,
      bet NUMERIC NOT NULL,
      symbols TEXT[] NOT NULL,
      win NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY,
      round_id UUID NOT NULL,
      player_token TEXT NOT NULL,
      type TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}


app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/config', (_req, res) => {
  res.json({ symbols: SYMBOLS, probabilities: PROB, payouts: PAYOUT, bets: BETS, operator: OPERATOR_NAME });
});

app.get('/player', async (req, res) => {
  try {
    let token = req.header('authorization')?.replace(/^token\s+/i, '') || '';
    if (!token) {
      const data = await wallet.authenticate(CASINO_SECRET, OPERATOR_NAME);
      token = data.token;
    }
    await pool.query('INSERT INTO players(token, operator) VALUES($1,$2) ON CONFLICT (token) DO NOTHING', [token, OPERATOR_NAME]);
    const bal = await wallet.balance({ token });
    res.json({ token, balance: bal.balance });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'player error' });
  }
});

app.post('/spin', async (req, res) => {
  const { bet, token } = req.body as { bet: number; token: string };
  try {
    if (!BETS.includes(bet)) return res.status(400).json({ error: 'Invalid bet' });
    if (!token) return res.status(401).json({ error: 'Missing token' });

    await pool.query('INSERT INTO players(token, operator) VALUES($1,$2) ON CONFLICT (token) DO NOTHING', [token, OPERATOR_NAME]);
    const roundId = randomUUID();
    const withdrawTxId = randomUUID();
    await wallet.transaction({ transactionId: withdrawTxId, roundId, amount: bet, type: 'withdraw', createdAt: new Date(), playerId: 'demo', token } as any);
    await pool.query('INSERT INTO transactions(id, round_id, player_token, type, amount) VALUES($1,$2,$3,$4,$5)', [
      withdrawTxId,
      roundId,
      token,
      'withdraw',
      bet,
    ]);

    const s1 = weightedPick();
    const s2 = weightedPick();
    const s3 = weightedPick();
    const symbols = [s1, s2, s3];
    const win = s1 === s2 && s2 === s3 ? bet * PAYOUT[s1] : 0;

    await pool.query('INSERT INTO rounds(id, player_token, bet, symbols, win) VALUES($1,$2,$3,$4,$5)', [
      roundId,
      token,
      bet,
      symbols,
      win,
    ]);
    if (win > 0) {
      const depositTxId = randomUUID();
      await wallet.transaction({ transactionId: depositTxId, roundId, amount: win, type: 'deposit', createdAt: new Date(), playerId: 'demo', token } as any);
      await pool.query('INSERT INTO transactions(id, round_id, player_token, type, amount) VALUES($1,$2,$3,$4,$5)', [
        depositTxId,
        roundId,
        token,
        'deposit',
        win,
      ]);
    }

    const bal = await wallet.balance({ token });
    res.json({ roundId, symbols, win, balance: bal.balance });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'spin error' });
  }
});

app.get('/replay/:roundId', async (req, res) => {
  try {
    const id = req.params.roundId;
    const r = await pool.query('SELECT id, player_token, bet, symbols, win, created_at FROM rounds WHERE id=$1', [id]);
    if (!r.rowCount) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'replay error' });
  }
});

app.listen(PORT, async () => {
  await migrate();
  await wallet.init({ baseUrl: CASINO_BASE_URL, secret: CASINO_SECRET });
  console.log(`Game server listening on ${PORT}`);
});
