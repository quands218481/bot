import { ethers } from 'ethers';

export class CreateUserDto {
  readonly telegramId: string;
  readonly password: string;
  readonly privateKeys: Array<string>;
  readonly wallets: Array<string>;

  constructor(
    telegramId: string,
    password: string,
    privateKeys: Array<string>,
  ) {
    this.telegramId = telegramId;
    this.password = password;
    this.privateKeys = privateKeys;
    this.wallets = privateKeys.map((pk) => new ethers.Wallet(pk).address);
  }
}
