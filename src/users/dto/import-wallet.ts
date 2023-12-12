import { ethers } from 'ethers';

export class ImportWalletDto {
  readonly telegramId: string;
  readonly password: string;
  readonly privateKey: string;
  readonly wallet: string;

  constructor(telegramId: string, password: string, privateKey: string) {
    this.telegramId = telegramId;
    this.privateKey = privateKey;
    this.password = password;
    this.wallet = new ethers.Wallet(this.privateKey).address;
  }
}
