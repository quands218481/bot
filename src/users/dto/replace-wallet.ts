import { ethers } from 'ethers';

export class ReplaceWalletDto {
  readonly telegramId: string;
  readonly password: string;
  readonly privateKey: string;
  readonly index: number;
  readonly wallet: string;

  constructor(
    telegramId: string,
    password: string,
    privateKey: string,
    index: number,
  ) {
    this.telegramId = telegramId;
    this.privateKey = privateKey;
    this.index = index;
    this.password = password;
    this.wallet = new ethers.Wallet(this.privateKey).address;
  }
}
