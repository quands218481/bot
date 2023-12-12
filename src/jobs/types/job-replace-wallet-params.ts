export class JobReplaceWalletParams {
  walletIndex: number;
  replyId: string;
  replyChatId: string;

  constructor(walletIndex: number, replyChatId: string, replyId: string) {
    this.walletIndex = walletIndex;
    this.replyId = replyId;
    this.replyChatId = replyChatId;
  }

  toJSON(): string {
    return JSON.stringify({
      walletIndex: this.walletIndex,
      replyChatId: this.replyChatId,
      replyId: this.replyId,
    });
  }

  static fromJSON(json: string) {
    const { walletIndex, replyId, replyChatId } = JSON.parse(json);
    return new JobReplaceWalletParams(walletIndex, replyChatId, replyId);
  }
}
