import { ethers } from 'ethers';
import { verifySecretKey } from 'src/app.util';

export class MessageWithdrawParams {
  sceretKey: string;
  recipient: string;
  relayer: boolean;

  constructor(sceretKey: string, recipient: string, relayer: boolean) {
    this.sceretKey = sceretKey;
    this.recipient = recipient;
    this.relayer = relayer;
  }

  toJSON(): string {
    return JSON.stringify({
      sceretKey: this.sceretKey,
      recipient: this.recipient,
      relayer: this.relayer,
    });
  }

  static fromJSON(json: string): MessageWithdrawParams {
    const { sceretKey, recipient, relayer } = JSON.parse(json);
    return new MessageWithdrawParams(sceretKey, recipient, relayer);
  }

  validate(): boolean {
    return (
      verifySecretKey(this.sceretKey) != false &&
      ethers.isAddress(this.recipient)
    );
  }
}
