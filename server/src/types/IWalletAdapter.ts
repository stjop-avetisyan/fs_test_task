export interface IWalletBalance {
    balance: number;
}

export interface IWalletAuthenticate {
    token: string;
    balance: number;
}

export interface IWalletTransaction {
    transactionId: string;
    createdAt: Date;
    type: TransactionType;
    amount: number;
    roundId: string;
    playerId: string;
}




export default interface IWalletAdapter {

    config: any;

    init(config: any): Promise<void>;

    authenticate(key: string, operator: string): Promise<IWalletAuthenticate>;

    balance(player: {token}): Promise<IWalletBalance>;

    transaction( transaction: IWalletTransaction): Promise<IWalletBalance>;

    cancel( transaction: IWalletTransaction): Promise<IWalletBalance>;

}
