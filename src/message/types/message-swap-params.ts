import { ethers } from 'ethers';
import { verifySecretKey } from 'src/app.util';

export class MessageSwapParams {
  sceretKey: string;
  token: string;
  slippage: number;
  recipient: string;
  relayer: boolean;

  constructor(
    sceretKey,
    token: string,
    slippage: number,
    recipient: string,
    relayer: boolean,
  ) {
    this.sceretKey = sceretKey;
    this.token = token;
    this.slippage = slippage;
    this.relayer = relayer;
    this.recipient = recipient;
  }

  toJSON(): string {
    return JSON.stringify({
      sceretKey: this.sceretKey,
      token: this.token,
      slippage: this.slippage,
      relayer: this.relayer,
      recipient: this.recipient,
    });
  }

  static fromJSON(json: string): MessageSwapParams {
    const { sceretKey, token, slippage, relayer, recipient } = JSON.parse(json);
    return new MessageSwapParams(
      sceretKey,
      token,
      slippage,
      recipient,
      relayer,
    );
  }

  validate(): boolean {
    return (
      verifySecretKey(this.sceretKey) != false &&
      ethers.isAddress(this.token) &&
      ethers.isAddress(this.recipient) &&
      this.slippage > 0
    );
  }
}
