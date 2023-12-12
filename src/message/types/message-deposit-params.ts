export class MessageDepositParams {
  wallets: Array<number>;
  amount: number;

  constructor(wallets: Array<number>, amount: number) {
    this.wallets = wallets;
    this.amount = amount;
  }

  toJSON(): string {
    return JSON.stringify({
      wallets: this.wallets,
      amount: this.amount,
    });
  }

  static fromJSON(json: string): MessageDepositParams {
    const { wallets, amount } = JSON.parse(json);
    return new MessageDepositParams(wallets, amount ?? 0.1);
  }

  validate(): boolean {
    return this.amount && this.wallets.length > 0;
  }
}
