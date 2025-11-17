import React, { useEffect, useRef, useState } from 'react';

type Config = {
  symbols: string[];
  probabilities: Record<string, number>;
  payouts: Record<string, number>;
  bets: number[];
  operator: string;
};

const API = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [token, setToken] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [bet, setBet] = useState<number>(1);
  const [reels, setReels] = useState<string[]>(['🍊', '🍊', '🍊']);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState<number>(0);
  const [message, setMessage] = useState<{ text: string; type: 'win' | 'lose' | '' }>({ text: '', type: '' });
  const [txn, setTxn] = useState<{ amount: number; show: boolean } | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const cfg = await fetch(`${API}/config`).then(r => r.json());
      setConfig(cfg);
      setBet(cfg.bets[2] || 1);
      const p = await fetch(`${API}/player`).then(r => r.json());
      setToken(p.token);
      setBalance(p.balance);
    })().catch(console.error);
  }, []);

  const onSpin = async () => {
    if (!config || spinning) return;
    if (bet > balance) {
      setMessage({ text: 'NOT ENOUGH BALANCE!', type: 'lose' });
      return;
    }
    setSpinning(true);
    setWin(0);
    setMessage({ text: '', type: '' });
    showTransaction(-bet);
    const anim = window.setInterval(() => {
      setReels(r => r.map(() => randomSymbol(config.symbols)));
    }, 100);
    animRef.current = anim;
    try {
      const res = await fetch(`${API}/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet, token })
      }).then(r => r.json());
      window.clearInterval(anim);
      setReels(res.symbols);
      setWin(res.win);
      setBalance(res.balance);
      if (res.win > 0) {
        setMessage({ text: `YOU WIN ${Number(res.win).toFixed(2)}€!`, type: 'win' });
        showTransaction(res.win);
      } else {
        setMessage({ text: 'TRY AGAIN!', type: 'lose' });
      }
    } catch (e) {
      window.clearInterval(anim);
      console.error(e);
    } finally {
      setSpinning(false);
    }
  };

  if (!config) return <div style={styles.wrap}>Loading...</div>;

  function showTransaction(amount: number) {
    setTxn({ amount, show: true });
    window.setTimeout(() => setTxn(prev => (prev ? { ...prev, show: false } : prev)), 1500);
  }

  return (
    <div style={styles.wrap}>
      <div className="container">
        <h1>BEST SLOT EVER</h1>

        <div className="game-area">
          <div className="slots-container">
            {reels.map((s, i) => (
              <div key={i} className={`reel${spinning ? ' spinning' : ''}`}>{s}</div>
            ))}
          </div>

          <div className="controls">
            <div className="bet-box" style={{position:'relative'}}>
              <select
                value={bet}
                onChange={e => setBet(parseFloat(e.target.value))}
                disabled={spinning}
                aria-label="Select bet"
                style={{
                  position:'absolute', inset:0, width:'100%', height:'100%',
                  appearance:'none', WebkitAppearance:'none', MozAppearance:'none',
                  fontSize:'inherit', fontWeight:900, color:'#000', textAlign:'center',
                  border:'none', background:'transparent', cursor: spinning ? 'not-allowed' : 'pointer'
                }}
              >
                {config.bets.map(b => (
                  <option key={b} value={b}>{b}€</option>
                ))}
              </select>
            </div>
            <div className={`spin-box${spinning || bet > balance ? ' disabled' : ''}`} onClick={onSpin}>
              {spinning ? 'SPINNING...' : 'SPIN'}
            </div>
          </div>
        </div>

        <div className="balance-display" id="balance">BALANCE: {balance.toFixed(2)} €</div>
        <div className={`message${message.type ? ' ' + message.type : ''}`} id="message">{message.text}</div>

        <h3 style={{marginTop: 20}}>Payouts</h3>
        <ul>
          {Object.entries(config.payouts).map(([sym, mult]) => (
            <li key={sym}>{sym} {sym} {sym} - {mult}x</li>
          ))}
        </ul>
      </div>

      <div className={`transaction${txn && txn.show ? ' show' : ''}`} style={{color: txn && txn.amount > 0 ? '#28a745' : '#dc3545'}}>
        {txn ? `${txn.amount > 0 ? '+' : ''}${txn.amount}€` : ''}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .container { text-align: center; max-width: 1400px; width: 100%; margin: 0 auto; }
        h1 { font-size: clamp(2em, 8vw, 5em); font-weight: 900; margin-bottom: clamp(30px, 5vh, 60px); color: #000; letter-spacing: clamp(2px, 1vw, 8px); }
        .game-area { display: flex; justify-content: center; align-items: center; gap: clamp(20px, 3vw, 40px); flex-wrap: wrap; }
        .slots-container { display: flex; gap: clamp(15px, 3vw, 40px); flex-wrap: wrap; justify-content: center; }
        .reel { width: clamp(80px, 20vw, 280px); height: clamp(100px, 28vw, 400px); border: clamp(4px, 1.5vw, 15px) solid #000; background: #fff; display: flex; justify-content: center; align-items: center; font-size: clamp(80px, 14vw, 180px); position: relative; overflow: hidden; border-radius: 8px; }
        .reel.spinning { animation: spin 0.08s linear infinite; }
        @keyframes spin { 0% { transform: translateY(0); } 100% { transform: translateY(-30px); } }
        .controls { display: flex; flex-direction: column; gap: clamp(20px, 3vw, 40px); }
        .bet-box, .spin-box { width: clamp(120px, 20vw, 280px); height: clamp(80px, 14vw, 180px); border: clamp(4px, 1.5vw, 15px) solid #000; background: #fff; display: flex; justify-content: center; align-items: center; font-size: clamp(2em, 5vw, 4em); font-weight: 900; color: #000; border-radius: 8px; position: relative; overflow: hidden; }
        .spin-box { cursor: pointer; transition: all 0.2s ease; user-select: none; }
        .spin-box:hover { background: #f0f0f0; }
        .spin-box:active { background: #e0e0e0; }
        .spin-box.disabled { cursor: not-allowed; opacity: 0.5; }
        .balance-display { margin-top: clamp(30px, 5vh, 60px); font-size: clamp(2em, 5vw, 4em); font-weight: 900; color: #000; }
        .transaction { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: clamp(3em, 8vw, 5em); font-weight: 900; pointer-events: none; opacity: 0; z-index: 1000; }
        .transaction.show { animation: float-up 1.5s ease-out; opacity: 1; }
        @keyframes float-up { 0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); } 50% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -200%) scale(1.5); } }
        .message { margin-top: clamp(20px, 3vh, 30px); font-size: clamp(1.2em, 3vw, 2.5em); font-weight: 900; min-height: clamp(40px, 5vh, 60px); color: #000; }
        .message.win { color: #28a745; animation: pulse 0.5s ease-in-out; }
        .message.lose { color: #dc3545; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @media (max-width: 768px) { .game-area { flex-direction: column; } .slots-container { order: 1; } .controls { order: 2; flex-direction: row; width: 100%; justify-content: center; } }
        @media (max-width: 480px) { .reel { width: clamp(70px, 20vw, 280px); height: clamp(80px, 28vw, 400px); font-size: clamp(60px, 14vw, 180px); } }
       
      `}</style>
    </div>
  );
}

function randomSymbol(list: string[]) { return list[Math.floor(Math.random() * list.length)]; }

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1400, margin: '20px auto', fontFamily: 'system-ui, Arial', textAlign: 'center', padding: 20 },
  info: { fontSize: 12, color: '#666', marginTop: 10 },
};
