import axios from 'axios';
import crypto from 'crypto';
import type IWalletAdapter, { IWalletAuthenticate, IWalletBalance, IWalletTransaction } from './types/IWalletAdapter.js';

type Cfg = { baseUrl: string; secret: string };

class WalletAdapter implements IWalletAdapter {
  public config: Cfg | null = null;

  async init(config: Cfg): Promise<void> {
    this.config = config;
  }

  private sign(body: any) {
    if (!this.config) throw new Error('wallet not initialized');
    return crypto.createHmac('sha256', this.config.secret).update(JSON.stringify(body)).digest('hex');
  }

  private headers(body: any, token?: string) {
    const headers: Record<string, string> = { 'x-server-authorization': this.sign(body) };
    if (token) headers['authorization'] = `token ${token}`;
    return headers;
  }

  async authenticate(key: string, operator: string): Promise<IWalletAuthenticate> {
    if (!this.config) throw new Error('wallet not initialized');
    const body = { operator, key };
    const { data } = await axios.post(`${this.config.baseUrl}/authenticate`, body, { headers: this.headers(body) });
    return data as IWalletAuthenticate;
  }

  async balance(player: { token: string }): Promise<IWalletBalance> {
    if (!this.config) throw new Error('wallet not initialized');
    const body = {};
    const { data } = await axios.post(`${this.config.baseUrl}/balance`, body, { headers: this.headers(body, player.token) });
    return data as IWalletBalance;
  }

  async transaction(transaction: IWalletTransaction): Promise<IWalletBalance> {
    if (!this.config) throw new Error('wallet not initialized');
    const { data } = await axios.put(`${this.config.baseUrl}/transaction`, transaction, {
      headers: this.headers(transaction, (transaction as any).token),
    });
    return data as IWalletBalance;
  }

  async cancel(transaction: IWalletTransaction): Promise<IWalletBalance> {
    if (!this.config) throw new Error('wallet not initialized');
    const { data } = await axios.delete(`${this.config.baseUrl}/cancel`, {
      headers: { ...this.headers(transaction, (transaction as any).token), 'Content-Type': 'application/json' },
      data: transaction,
    });
    return data as IWalletBalance;
  }
}

export const wallet = new WalletAdapter();
export default WalletAdapter;
